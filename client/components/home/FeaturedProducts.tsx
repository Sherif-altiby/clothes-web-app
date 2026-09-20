import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
 import { FEATURED_PRODUCTS } from "@/lib/home-data";
import { ProductCard } from "../ProductCard";

export function FeaturedProducts() {
    const t = useTranslations("home.featured");

    return (
        <section className="container mx-auto px-4 pb-16 pt-4">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        {t("title")}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
                <Button asChild variant="outline" className="h-10 shrink-0 rounded-xl font-semibold">
                    <Link href="/category/new">{t("viewAll")}</Link>
                </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURED_PRODUCTS.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </section>
    );
}