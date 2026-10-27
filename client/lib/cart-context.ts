"use client";

import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useMemo,
    type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";

export interface CartItem {
    id: string;
    title: string;
    /** Final unit price returned by the server. */
    price: number;
    originalPrice?: number | null;
    discountPercentage: number;
    offerTitle: string | null;
    imageUrl: string;
    category: string;
    quantity: number;
}

const cartResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({
        items: z.array(
            z.object({
                productId: z.string(),
                quantity: z.number().int().positive(),
                unitPrice: z.number(),
                originalUnitPrice: z.number(),
                discountPercentage: z.number(),
                offerTitleAr: z.string().nullable(),
                offerTitleEn: z.string().nullable(),
                product: z.object({
                    title: z.string(),
                    baseSalary: z.number(),
                    profit: z.number(),
                    images: z.array(z.string()),
                    categoryId: z.string(),
                }),
            })
        ),
    }),
});

export const CART_QUERY_KEY = ["user-cart"] as const;
const EMPTY_CART: CartItem[] = [];

interface CartContextValue {
    items: CartItem[];
    hydrated: boolean;
    error: boolean;
    totalItems: number;
    subtotal: number;
    addItem: (productId: string, quantity?: number) => Promise<boolean>;
    updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
    removeItem: (productId: string) => Promise<boolean>;
    clearCart: () => Promise<boolean>;
    retry: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function parseCartResponse(response: unknown, locale: string): CartItem[] {
    const parsed = cartResponseSchema.safeParse(response);

    if (!parsed.success) {
        throw new Error("The server returned an invalid cart response.");
    }

    return parsed.data.data.items.map((item) => {
        return {
            id: item.productId,
            title: item.product.title,
            price: item.unitPrice,
            originalPrice: item.originalUnitPrice > item.unitPrice ? item.originalUnitPrice : null,
            discountPercentage: item.discountPercentage,
            offerTitle: locale === "ar" ? item.offerTitleAr : item.offerTitleEn,
            imageUrl: item.product.images[0] ?? "",
            category: `user/category/${item.product.categoryId}`,
            quantity: item.quantity,
        };
    });
}

async function requestCart(
    url: string,
    method: "get" | "post" | "patch" | "delete",
    locale: string,
    data?: unknown
) {
    const response = await api.request({
        url,
        method,
        data,
    });
    return parseCartResponse(response.data, locale);
}

export function CartProvider({ children }: { children: ReactNode }) {
    const locale = useLocale();
    const pathname = usePathname();
    const isProfilePage = /^\/(?:en|ar)\/user\/profile(?:\/|$)/.test(pathname ?? "");
    const isHomePage = /^\/(?:en|ar)\/user\/?$/.test(pathname ?? "");
    const isCategoryPage = /^\/(?:en|ar)\/user\/category(?:\/|$)/.test(pathname ?? "");
    const queryClient = useQueryClient();
    const t = useTranslations("cart");
    const cartQueryKey = useMemo(() => [...CART_QUERY_KEY, locale] as const, [locale]);
    const cartQuery = useQuery({
        queryKey: cartQueryKey,
        queryFn: async ({ signal }) => {
            const response = await api.get("/user/cart", {
                signal,
            });
            return parseCartResponse(response.data, locale);
        },
        enabled: !isProfilePage && !isHomePage && !isCategoryPage,
        retry: false,
        refetchInterval: 60_000,
    });

    const saveCart = useCallback(
        (items: CartItem[]) => queryClient.setQueryData(cartQueryKey, items),
        [queryClient, cartQueryKey]
    );

    const addMutation = useMutation({
        mutationFn: ({ productId, quantity, locale }: { productId: string; quantity: number; locale: string }) =>
            requestCart(
                "/user/cart",
                "post",
                locale,
                quantity === 1 ? { productId } : { productId, quantity }
            ),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("addSuccess"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const updateMutation = useMutation({
        mutationFn: ({ productId, quantity, locale }: { productId: string; quantity: number; locale: string }) =>
            requestCart("/user/cart", "patch", locale, { productId, quantity }),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("quantityUpdated"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const removeMutation = useMutation({
        mutationFn: ({ productId, locale }: { productId: string; locale: string }) =>
            requestCart(`/user/cart/${encodeURIComponent(productId)}`, "delete", locale),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("itemRemoved"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const clearMutation = useMutation({
        mutationFn: (locale: string) => requestCart("/user/cart", "delete", locale),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("cartCleared"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const addToCart = addMutation.mutateAsync;
    const updateCartQuantity = updateMutation.mutateAsync;
    const removeFromCart = removeMutation.mutateAsync;
    const clearServerCart = clearMutation.mutateAsync;

    const addItem = useCallback(async (productId: string, quantity = 1) => {
        try {
            await addToCart({ productId, quantity, locale });
            return true;
        } catch {
            return false;
        }
    }, [addToCart, locale]);
    const updateQuantity = useCallback(async (productId: string, quantity: number) => {
        try {
            await updateCartQuantity({ productId, quantity, locale });
            return true;
        } catch {
            return false;
        }
    }, [updateCartQuantity, locale]);
    const removeItem = useCallback(async (productId: string) => {
        try {
            await removeFromCart({ productId, locale });
            return true;
        } catch {
            return false;
        }
    }, [removeFromCart, locale]);
    const clearCart = useCallback(async () => {
        try {
            await clearServerCart(locale);
            return true;
        } catch {
            return false;
        }
    }, [clearServerCart, locale]);

    const items = cartQuery.data ?? EMPTY_CART;
    const totalItems = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
    const subtotal = useMemo(
        () => Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100) / 100,
        [items]
    );
    const refetchCart = cartQuery.refetch;
    const retry = useCallback(() => {
        void refetchCart();
    }, [refetchCart]);

    const value = useMemo(
        () => ({
            items,
            hydrated: cartQuery.isFetched,
            error: cartQuery.isError,
            totalItems,
            subtotal,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            retry,
        }),
        [
            items,
            cartQuery.isFetched,
            cartQuery.isError,
            totalItems,
            subtotal,
            addItem,
            updateQuantity,
            removeItem,
            clearCart,
            retry,
        ]
    );

    return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}
