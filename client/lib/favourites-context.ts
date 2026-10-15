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

/**
 * Product data used to render a favourite in the shared product-card component.
 * `price` is the regular price; the card applies `discountPercentage`.
 */
export interface FavouriteItem {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    imageUrl: string;
    rating?: number;
    reviewsCount?: number;
    category: string;
}

const favoritesResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({
        favorites: z.array(
            z.object({
                product: z.object({
                    id: z.string(),
                    title: z.string(),
                    description: z.string(),
                    baseSalary: z.number(),
                    profit: z.number(),
                    discount: z.number().nullable(),
                    images: z.array(z.string()),
                    categoryId: z.string(),
                }),
            })
        ),
    }),
});

const toggleResponseSchema = z.object({
    success: z.literal(true),
    data: z.object({ isFavorite: z.boolean() }),
});

export const FAVORITES_QUERY_KEY = ["user-favorites"] as const;
const EMPTY_FAVORITES: FavouriteItem[] = [];

interface FavouritesContextValue {
    items: FavouriteItem[];
    hydrated: boolean;
    error: boolean;
    totalItems: number;
    isFavourite: (id: string) => boolean;
    toggleFavourite: (item: FavouriteItem) => Promise<boolean | null>;
    removeFavourite: (id: string) => Promise<boolean>;
    clearFavourites: () => Promise<boolean>;
    retry: () => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

function toFavouriteItem(product: z.infer<typeof favoritesResponseSchema>["data"]["favorites"][number]["product"]): FavouriteItem {
    return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.baseSalary + product.profit,
        discountPercentage: product.discount ?? undefined,
        imageUrl: product.images[0] ?? "",
        category: `user/category/${product.categoryId}`,
    };
}

async function fetchFavorites(signal?: AbortSignal): Promise<FavouriteItem[]> {
    const response = await api.get("/user/favorites", {
        params: { limit: 100 },
        signal,
    });
    const parsed = favoritesResponseSchema.safeParse(response.data);

    if (!parsed.success) {
        throw new Error("The server returned an invalid favourites response.");
    }

    return parsed.data.data.favorites.map(({ product }) => toFavouriteItem(product));
}

async function deleteFavorite(productId: string): Promise<void> {
    await api.delete(`/user/favorites/${encodeURIComponent(productId)}`);
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isProfilePage = /^\/(?:en|ar)\/user\/profile(?:\/|$)/.test(pathname ?? "");
    const isHomePage = /^\/(?:en|ar)\/user\/?$/.test(pathname ?? "");
    const isCategoryPage = /^\/(?:en|ar)\/user\/category(?:\/|$)/.test(pathname ?? "");
    const queryClient = useQueryClient();
    const t = useTranslations("favourites");
    const favoritesQuery = useQuery({
        queryKey: FAVORITES_QUERY_KEY,
        queryFn: ({ signal }) => fetchFavorites(signal),
        enabled: !isProfilePage && !isHomePage && !isCategoryPage,
        retry: false,
    });

    const setFavorites = useCallback(
        (items: FavouriteItem[]) => queryClient.setQueryData(FAVORITES_QUERY_KEY, items),
        [queryClient]
    );
    const refreshFavorites = useCallback(
        () => queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
        [queryClient]
    );

    const toggleMutation = useMutation({
        mutationFn: async (item: FavouriteItem) => {
            const response = await api.post("/user/favorites/toggle", { productId: item.id });
            const parsed = toggleResponseSchema.safeParse(response.data);

            if (!parsed.success) {
                throw new Error("The server returned an invalid favourite response.");
            }

            return { item, isFavorite: parsed.data.data.isFavorite };
        },
        onSuccess: ({ item, isFavorite }) => {
            const current = queryClient.getQueryData<FavouriteItem[]>(FAVORITES_QUERY_KEY) ?? [];
            setFavorites(
                isFavorite
                    ? [item, ...current.filter((favorite) => favorite.id !== item.id)]
                    : current.filter((favorite) => favorite.id !== item.id)
            );
            toast.success(isFavorite ? t("addSuccess") : t("removeSuccess"));
        },
        onError: () => toast.error(t("updateError")),
    });

    const removeMutation = useMutation({
        mutationFn: deleteFavorite,
        onSuccess: (_result, productId) => {
            const current = queryClient.getQueryData<FavouriteItem[]>(FAVORITES_QUERY_KEY) ?? [];
            setFavorites(current.filter((favorite) => favorite.id !== productId));
            toast.success(t("removeSuccess"));
        },
        onError: () => toast.error(t("updateError")),
    });

    const clearMutation = useMutation({
        mutationFn: async (items: FavouriteItem[]) => {
            const results = await Promise.allSettled(items.map(({ id }) => deleteFavorite(id)));
            const failedCount = results.filter((result) => result.status === "rejected").length;

            if (failedCount > 0) {
                throw new Error(`Failed to remove ${failedCount} favourite item(s).`);
            }
        },
        onSuccess: () => {
            setFavorites([]);
            toast.success(t("clearSuccess"));
        },
        onError: () => {
            void refreshFavorites();
            toast.error(t("updateError"));
        },
    });
    const toggleFavoriteRequest = toggleMutation.mutateAsync;
    const removeFavoriteRequest = removeMutation.mutateAsync;
    const clearFavoritesRequest = clearMutation.mutateAsync;
    const refetchFavorites = favoritesQuery.refetch;
    const loadedFavorites = favoritesQuery.data ?? EMPTY_FAVORITES;

    const isFavourite = useCallback(
        (id: string) => loadedFavorites.some((item) => item.id === id),
        [loadedFavorites]
    );

    const toggleFavourite = useCallback(
        async (item: FavouriteItem): Promise<boolean | null> => {
            try {
                const result = await toggleFavoriteRequest(item);
                return result.isFavorite;
            } catch {
                return null;
            }
        },
        [toggleFavoriteRequest]
    );

    const removeFavourite = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                await removeFavoriteRequest(id);
                return true;
            } catch {
                return false;
            }
        },
        [removeFavoriteRequest]
    );

    const clearFavourites = useCallback(
        async (): Promise<boolean> => {
            try {
                await clearFavoritesRequest(loadedFavorites);
                return true;
            } catch {
                return false;
            }
        },
        [clearFavoritesRequest, loadedFavorites]
    );

    const retry = useCallback(() => {
        void refetchFavorites();
    }, [refetchFavorites]);

    const items = loadedFavorites;
    const value = useMemo(
        () => ({
            items,
            hydrated: favoritesQuery.isFetched,
            error: favoritesQuery.isError,
            totalItems: items.length,
            isFavourite,
            toggleFavourite,
            removeFavourite,
            clearFavourites,
            retry,
        }),
        [
            items,
            favoritesQuery.isFetched,
            favoritesQuery.isError,
            isFavourite,
            toggleFavourite,
            removeFavourite,
            clearFavourites,
            retry,
        ]
    );

    return createElement(FavouritesContext.Provider, { value }, children);
}

export function useFavourites() {
    const ctx = useContext(FavouritesContext);
    if (!ctx) throw new Error("useFavourites must be used inside <FavouritesProvider>");
    return ctx;
}
