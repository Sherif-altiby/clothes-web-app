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
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";

export interface CartItem {
    id: string;
    title: string;
    /** Final unit price returned by the server. */
    price: number;
    originalPrice?: number | null;
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

function parseCartResponse(response: unknown): CartItem[] {
    const parsed = cartResponseSchema.safeParse(response);

    if (!parsed.success) {
        throw new Error("The server returned an invalid cart response.");
    }

    return parsed.data.data.items.map((item) => {
        const originalPrice = item.product.baseSalary + item.product.profit;

        return {
            id: item.productId,
            title: item.product.title,
            price: item.unitPrice,
            originalPrice: originalPrice > item.unitPrice ? originalPrice : null,
            imageUrl: item.product.images[0] ?? "",
            category: `user/category/${item.product.categoryId}`,
            quantity: item.quantity,
        };
    });
}

async function requestCart(url: string, method: "get" | "post" | "patch" | "delete", data?: unknown) {
    const response = await api.request({ url, method, data });
    return parseCartResponse(response.data);
}

export function CartProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isProfilePage = /^\/(?:en|ar)\/user\/profile(?:\/|$)/.test(pathname ?? "");
    const isHomePage = /^\/(?:en|ar)\/user\/?$/.test(pathname ?? "");
    const isCategoryPage = /^\/(?:en|ar)\/user\/category(?:\/|$)/.test(pathname ?? "");
    const queryClient = useQueryClient();
    const t = useTranslations("cart");
    const cartQuery = useQuery({
        queryKey: CART_QUERY_KEY,
        queryFn: async ({ signal }) => {
            const response = await api.get("/user/cart", { signal });
            return parseCartResponse(response.data);
        },
        enabled: !isProfilePage && !isHomePage && !isCategoryPage,
        retry: false,
    });

    const saveCart = useCallback(
        (items: CartItem[]) => queryClient.setQueryData(CART_QUERY_KEY, items),
        [queryClient]
    );

    const addMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            requestCart(
                "/user/cart",
                "post",
                quantity === 1 ? { productId } : { productId, quantity }
            ),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("addSuccess"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const updateMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            requestCart("/user/cart", "patch", { productId, quantity }),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("quantityUpdated"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const removeMutation = useMutation({
        mutationFn: (productId: string) =>
            requestCart(`/user/cart/${encodeURIComponent(productId)}`, "delete"),
        onSuccess: (items) => {
            saveCart(items);
            toast.success(t("itemRemoved"));
        },
        onError: () => toast.error(t("updateError")),
    });
    const clearMutation = useMutation({
        mutationFn: () => requestCart("/user/cart", "delete"),
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
            await addToCart({ productId, quantity });
            return true;
        } catch {
            return false;
        }
    }, [addToCart]);
    const updateQuantity = useCallback(async (productId: string, quantity: number) => {
        try {
            await updateCartQuantity({ productId, quantity });
            return true;
        } catch {
            return false;
        }
    }, [updateCartQuantity]);
    const removeItem = useCallback(async (productId: string) => {
        try {
            await removeFromCart(productId);
            return true;
        } catch {
            return false;
        }
    }, [removeFromCart]);
    const clearCart = useCallback(async () => {
        try {
            await clearServerCart();
            return true;
        } catch {
            return false;
        }
    }, [clearServerCart]);

    const items = cartQuery.data ?? EMPTY_CART;
    const totalItems = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);
    const subtotal = useMemo(
        () => items.reduce((total, item) => total + item.price * item.quantity, 0),
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
