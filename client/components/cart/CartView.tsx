"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 9.99;

const money = (n: number) => `$${n.toFixed(2)}`;

export function CartView() {
    const t = useTranslations("cart");
    const { items, hydrated, totalItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();

    /* ── Loading (reading localStorage) ── */
    if (!hydrated) {
        return (
            <div className="grid animate-pulse gap-8 lg:grid-cols-[1fr_380px]">
                <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-36 rounded-2xl bg-muted/40" />
                    ))}
                </div>
                <div className="h-72 rounded-3xl bg-muted/40" />
            </div>
        );
    }

    /* ── Empty ── */
    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShoppingBag className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">{t("emptyTitle")}</h1>
                <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
                <Button asChild size="lg" className="mt-2 h-12 rounded-xl px-6 font-bold">
                    <Link href="/">{t("continue")}</Link>
                </Button>
            </div>
        );
    }

    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

    return (
        <div>
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground">{t("itemsCount", { count: totalItems })}</p>
                </div>
                <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                    {t("clear")}
                </button>
            </div>

            <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
                {/* ── Items ── */}
                <ul className="space-y-4">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex gap-4 rounded-2xl border border-border/50 bg-card/40 p-3 backdrop-blur-md"
                        >
                            <Link
                                href={`/user/product/${item.id}`}
                                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/30"
                            >
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    sizes="96px"
                                    className="object-cover object-center"
                                />
                            </Link>

                            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 space-y-1">
                                        <Link
                                            href={`/user/product/${item.id}`}
                                            className="line-clamp-1 text-base font-bold tracking-tight text-foreground/90 transition-colors hover:text-primary"
                                        >
                                            {item.title}
                                        </Link>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-semibold text-foreground">{money(item.price)}</span>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                                                    {money(item.originalPrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        aria-label={t("remove", { name: item.title })}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    {/* Quantity stepper (same look as the product page) */}
                                    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-border">
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            aria-label={t("decrease")}
                                            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-semibold text-foreground">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            aria-label={t("increase")}
                                            className="flex h-full w-10 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <span className="text-lg font-black tracking-tight text-foreground">
                                        {money(item.price * item.quantity)}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

                {/* ── Summary ── */}
                <aside className="space-y-5 rounded-3xl border border-border/50 bg-card/40 p-6 backdrop-blur-md lg:sticky lg:top-24">
                    <h2 className="text-lg font-black tracking-tight text-foreground">{t("summary")}</h2>

                    {/* Free-shipping progress */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            {remaining > 0
                                ? t("freeShippingLeft", { amount: money(remaining) })
                                : t("freeShippingReached")}
                        </p>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">{t("subtotal")}</dt>
                            <dd className="font-semibold text-foreground">{money(subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-muted-foreground">{t("shipping")}</dt>
                            <dd className="font-semibold text-foreground">
                                {shipping === 0 ? t("free") : money(shipping)}
                            </dd>
                        </div>
                        <div className="flex justify-between border-t border-border/40 pt-4 text-base">
                            <dt className="font-bold text-foreground">{t("total")}</dt>
                            <dd className="text-xl font-black tracking-tight text-foreground">{money(total)}</dd>
                        </div>
                    </dl>

                    <Button
                        asChild
                        size="lg"
                        className="h-12 w-full rounded-xl text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/25 active:translate-y-0"
                    >
                        <Link href="/checkout">{t("checkout")}</Link>
                    </Button>

                    <Link
                        href="/"
                        className="block text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        {t("continue")}
                    </Link>
                </aside>
            </div>
        </div>
    );
}