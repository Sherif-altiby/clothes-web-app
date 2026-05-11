"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Trash2,
    ShoppingBag,
    ArrowLeft,
    Tag,
    Truck,
    Shield,
    ChevronRight,
    Plus,
    Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── mock cart items ─────────────────────────────────────────── */
interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    image: string;
    size: string;
    color: string;
    quantity: number;
}

const INITIAL_CART: CartItem[] = [
    {
        id: "1",
        name: "Urban Explorer Jacket",
        description: "Water-resistant outer shell with fleece lining",
        price: 189.99,
        originalPrice: 249.99,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
        size: "M",
        color: "Navy Blue",
        quantity: 1,
    },
    {
        id: "2",
        name: "Classic Slim Chinos",
        description: "Premium stretch cotton — all-day comfort",
        price: 79.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80",
        size: "32 × 30",
        color: "Khaki",
        quantity: 2,
    },
    {
        id: "3",
        name: "Merino Wool Sweater",
        description: "Ultra-soft 100% merino wool, breathable & warm",
        price: 129.99,
        originalPrice: 159.99,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
        size: "L",
        color: "Charcoal",
        quantity: 1,
    },
];

const SHIPPING_THRESHOLD = 100;
const PROMO_CODES: Record<string, number> = { SAVE10: 10, WELCOME20: 20 };

/* ─── Cart Item Card ─────────────────────────────────────────── */
function CartItemCard({
    item,
    onUpdateQty,
    onRemove,
}: {
    item: CartItem;
    onUpdateQty: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
}) {
    const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    const lineTotal = item.price * item.quantity;

    return (
        <div className="group flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
            {/* Product image */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-muted/30">
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="112px"
                />
                {discount > 0 && (
                    <div className="absolute top-1 left-1 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        -{discount}%
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">
                            {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                    </div>
                    {/* Remove button */}
                    <button
                        id={`remove-item-${item.id}`}
                        onClick={() => onRemove(item.id)}
                        aria-label="Remove item"
                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Variants */}
                <div className="flex gap-2 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium border border-border/50">
                        Size: {item.size}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium border border-border/50">
                        {item.color}
                    </span>
                </div>

                {/* Quantity + price row */}
                <div className="flex items-center justify-between gap-3 mt-auto">
                    {/* Qty picker */}
                    <div className="flex items-center rounded-xl border border-border/70 overflow-hidden h-8">
                        <button
                            id={`qty-minus-${item.id}`}
                            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="px-2.5 h-full text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-foreground">
                            {item.quantity}
                        </span>
                        <button
                            id={`qty-plus-${item.id}`}
                            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            className="px-2.5 h-full text-muted-foreground hover:bg-muted/50 transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <p className="text-base font-black text-foreground">${lineTotal.toFixed(2)}</p>
                        {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground">${item.price.toFixed(2)} each</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Empty Cart ─────────────────────────────────────────────── */
function EmptyCart() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted/40 flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                    0
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-foreground">Your cart is empty</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Looks like you haven&apos;t added anything yet. Start shopping and find something you love!
                </p>
            </div>
            <Button asChild size="lg" className="rounded-xl gap-2 px-8">
                <Link href="..">
                    <ShoppingBag className="h-4 w-4" />
                    Start Shopping
                </Link>
            </Button>
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function CartPage() {
    const [items, setItems] = useState<CartItem[]>(INITIAL_CART);
    const [promoInput, setPromoInput] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [promoError, setPromoError] = useState("");

    /* helpers */
    const updateQty = (id: string, qty: number) => {
        if (qty < 1) return;
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it)));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const applyPromo = () => {
        const code = promoInput.trim().toUpperCase();
        if (PROMO_CODES[code]) {
            setAppliedPromo(code);
            setPromoError("");
            setPromoInput("");
        } else {
            setPromoError("Invalid promo code");
        }
    };

    /* totals */
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const originalTotal = items.reduce((sum, it) => sum + it.originalPrice * it.quantity, 0);
    const itemSavings = originalTotal - subtotal;
    const promoDiscount = appliedPromo ? (subtotal * PROMO_CODES[appliedPromo]) / 100 : 0;
    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : 9.99;
    const total = subtotal - promoDiscount + shipping;
    const totalItems = items.reduce((s, it) => s + it.quantity, 0);

    if (items.length === 0) return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="max-w-4xl mx-auto">
                <EmptyCart />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background px-4 py-10">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted/50">
                        <Link href=".." aria-label="Back">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground">Shopping Cart</h1>
                        <p className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

                    {/* ══ LEFT – Cart Items ══ */}
                    <div className="flex flex-col gap-3">
                        {items.map((item) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                onUpdateQty={updateQty}
                                onRemove={removeItem}
                            />
                        ))}

                        {/* Continue shopping */}
                        <Link
                            href=".."
                            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline underline-offset-4 mt-2 self-start transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Continue Shopping
                        </Link>
                    </div>

                    {/* ══ RIGHT – Order Summary ══ */}
                    <div className="flex flex-col gap-4 sticky top-6">
                        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
                            <h2 className="text-lg font-black text-foreground">Order Summary</h2>

                            {/* Line items */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({totalItems} items)</span>
                                    <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                                </div>

                                {itemSavings > 0 && (
                                    <div className="flex justify-between text-destructive">
                                        <span>Items discount</span>
                                        <span className="font-semibold">-${itemSavings.toFixed(2)}</span>
                                    </div>
                                )}

                                {promoDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span className="flex items-center gap-1.5">
                                            <Tag className="h-3 w-3" />
                                            Promo ({appliedPromo})
                                        </span>
                                        <span className="font-semibold">-${promoDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Truck className="h-3 w-3" />
                                        Shipping
                                    </span>
                                    {shipping === 0 ? (
                                        <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
                                    ) : (
                                        <span className="font-medium text-foreground">${shipping.toFixed(2)}</span>
                                    )}
                                </div>

                                {shipping > 0 && (
                                    <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                                        Add <span className="font-bold text-primary">${(SHIPPING_THRESHOLD - subtotal).toFixed(2)}</span> more for free shipping!
                                    </p>
                                )}
                            </div>

                            <div className="border-t border-border/50 pt-4 flex justify-between items-center">
                                <span className="font-black text-foreground text-base">Total</span>
                                <span className="font-black text-foreground text-xl">${total.toFixed(2)}</span>
                            </div>

                            {/* Promo code */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Promo Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="promo-input"
                                        type="text"
                                        value={promoInput}
                                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                                        placeholder="e.g. SAVE10"
                                        className="flex-1 h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                                    />
                                    <Button
                                        id="btn-apply-promo"
                                        size="sm"
                                        variant="outline"
                                        onClick={applyPromo}
                                        className="rounded-xl h-10 px-4 font-semibold"
                                    >
                                        Apply
                                    </Button>
                                </div>
                                {promoError && (
                                    <p className="text-xs text-destructive font-medium">{promoError}</p>
                                )}
                                {appliedPromo && (
                                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                                            <Tag className="h-3 w-3" />
                                            {appliedPromo} applied!
                                        </p>
                                        <button
                                            onClick={() => setAppliedPromo(null)}
                                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Checkout */}
                            <Button
                                id="btn-checkout"
                                size="lg"
                                className="w-full h-12 rounded-xl font-bold text-sm gap-2 shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Proceed to Checkout
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            {/* Trust badges */}
                            <div className="flex items-center justify-center gap-5 pt-1">
                                {[
                                    { icon: Shield, label: "Secure Payment" },
                                    { icon: Truck, label: "Fast Delivery" },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
                                        <Icon className="h-3.5 w-3.5" />
                                        <span className="text-[11px] font-medium">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}