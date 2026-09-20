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

export interface CartItem {
    id: string;
    title: string;
    /** Final unit price (after discount) */
    price: number;
    /** Pre-discount unit price, if any – shown struck through */
    originalPrice?: number | null;
    imageUrl: string;
    category?: string;
    quantity: number;
}

export type NewCartItem = Omit<CartItem, "quantity">;

interface CartContextValue {
    items: CartItem[];
    /** false until localStorage has been read – avoids hydration flicker */
    hydrated: boolean;
    totalItems: number;
    subtotal: number;
    addItem: (item: NewCartItem, quantity?: number) => void;
    updateQuantity: (id: string, quantity: number) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
}

const STORAGE_KEY = "velnora-cart";
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
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

    // Persist every change (only after the first load, so we never overwrite saved data with [])
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            /* storage full or blocked – cart still works in memory */
        }
    }, [items, hydrated]);

    const addItem = useCallback((item: NewCartItem, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id
                        ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
                        : i
                );
            }
            return [...prev, { ...item, quantity: Math.min(MAX_QTY, quantity) }];
        });
    }, []);

    const updateQuantity = useCallback((id: string, quantity: number) => {
        const q = Math.max(1, Math.min(MAX_QTY, quantity));
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: q } : i)));
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
    const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.quantity, 0), [items]);

    const value = useMemo(
        () => ({ items, hydrated, totalItems, subtotal, addItem, updateQuantity, removeItem, clearCart }),
        [items, hydrated, totalItems, subtotal, addItem, updateQuantity, removeItem, clearCart]
    );

    // createElement instead of JSX, so this file compiles as .ts or .tsx
    return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}