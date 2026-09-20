"use client";

import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

/**
 * Everything needed to re-render a ProductCard on the favourites page.
 * `price` is the regular price; the card applies `discountPercentage` itself.
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

interface FavouritesContextValue {
    items: FavouriteItem[];
    /** false until localStorage has been read */
    hydrated: boolean;
    totalItems: number;
    isFavourite: (id: string) => boolean;
    /** Adds the item if missing, removes it if already saved. Returns the new state. */
    toggleFavourite: (item: FavouriteItem) => boolean;
    removeFavourite: (id: string) => void;
    clearFavourites: () => void;
}

const STORAGE_KEY = "velnora-favourites";

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

function readStorage(): FavouriteItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function FavouritesProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<FavouriteItem[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Load once on mount, and keep tabs in sync
    useEffect(() => {
        setItems(readStorage());
        setHydrated(true);

        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) setItems(readStorage());
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Persist every change (only after the first load)
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            /* storage full or blocked – favourites still work in memory */
        }
    }, [items, hydrated]);

    const isFavourite = useCallback(
        (id: string) => items.some((i) => i.id === id),
        [items]
    );

    const toggleFavourite = useCallback(
        (item: FavouriteItem) => {
            const exists = items.some((i) => i.id === item.id);
            setItems((prev) =>
                prev.some((i) => i.id === item.id)
                    ? prev.filter((i) => i.id !== item.id)
                    : [item, ...prev]
            );
            return !exists;
        },
        [items]
    );

    const removeFavourite = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }, []);

    const clearFavourites = useCallback(() => setItems([]), []);

    const value = useMemo(
        () => ({
            items,
            hydrated,
            totalItems: items.length,
            isFavourite,
            toggleFavourite,
            removeFavourite,
            clearFavourites,
        }),
        [items, hydrated, isFavourite, toggleFavourite, removeFavourite, clearFavourites]
    );

    // createElement instead of JSX, so this file compiles as .ts or .tsx
    return createElement(FavouritesContext.Provider, { value }, children);
}

export function useFavourites() {
    const ctx = useContext(FavouritesContext);
    if (!ctx) throw new Error("useFavourites must be used inside <FavouritesProvider>");
    return ctx;
}