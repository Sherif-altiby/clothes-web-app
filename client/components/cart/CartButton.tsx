"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

/** Navbar cart icon with an item-count badge */
export function CartButton() {
    const t = useTranslations("cart");
    const { totalItems, hydrated } = useCart();

    return (
        <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" aria-label={t("open", { count: totalItems })}>
                <ShoppingCart className="h-5 w-5 text-foreground/80 transition-colors hover:text-foreground" />
                {hydrated && totalItems > 0 && (
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {totalItems > 99 ? "99+" : totalItems}
                    </span>
                )}
            </Link>
        </Button>
    );
}