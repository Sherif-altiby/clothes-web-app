"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useFavourites } from "@/lib/favourites-context";

export function FavouritesView() {
    const t = useTranslations("favourites");
    const locale = useLocale();
    const { items, hydrated, error, totalItems, clearFavourites, retry } = useFavourites();

    if (!hydrated) {
        return (
            <div className="grid animate-pulse grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[380px] rounded-3xl bg-muted/40" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-md py-20 text-center" role="alert">
                <p className="text-muted-foreground">{t("loadError")}</p>
                <Button type="button" onClick={retry} className="mt-4">
                    {t("retry")}
                </Button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Heart className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">{t("emptyTitle")}</h1>
                <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
                <Button asChild size="lg" className="mt-2 h-12 rounded-xl px-6 font-bold">
                    <Link href={`/${locale}`}>{t("browse")}</Link>
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground">{t("itemsCount", { count: totalItems })}</p>
                </div>
                <button
                    type="button"
                    onClick={() => void clearFavourites()}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
                >
                    {t("clear")}
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((item) => (
                    <ProductCard key={item.id} {...item} />
                ))}
            </div>
        </div>
    );
}