"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ProductSkeleton } from "@/components/skeletons/ProductSkeleton";
import { api } from "@/lib/api";
import { ProductCard } from "../ProductCard";

interface Product {
    id: string;
    title: string;
    description: string;
    baseSalary: number;
    profit: number;
    discount: number | null;
    unitPrice: number;
    counts: number;
    images: string[];
    categoryId: string;
    reviewSummary: {
        averageRating: number;
        totalReviews: number;
    };
}

interface ProductsResponse {
    products: Product[];
}

interface Category {
    id: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function FeaturedProducts() {
    const t = useTranslations("home.featured");
    const locale = useLocale();
    const { data: categories } = useQuery({
        queryKey: ["categories", locale],
        queryFn: async () => {
            const response = await api.get<ApiResponse<Category[]>>("/user/categories", {
                headers: { "Accept-Language": locale },
            });

            return response.data.data;
        },
    });
    const {
        data: products,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["featured-products", locale],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<ProductsResponse>>("/user/products", {
                params: { limit: 8 },
                headers: { "Accept-Language": locale },
                signal,
            });

            return response.data.data.products;
        },
        staleTime: 5 * 60_000,
    });

    return (
        <section className="container mx-auto px-4 pb-16 pt-4">
            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl  tracking-tight text-foreground md:text-3xl font-bold">
                        {t("title")}
                    </h2>
                    <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
                {categories?.[0] && (
                    <Button asChild variant="outline" className="h-10 shrink-0 rounded-xl font-semibold">
                        <Link href={`user/category/${categories[0].id}`}>{t("viewAll")}</Link>
                    </Button>
                )}
            </div>

            {isLoading ? (
                <ProductSkeleton
                    count={8}
                    className="mt-8 justify-items-center lg:grid-cols-4"
                />
            ) : isError ? (
                <div className="mt-8 rounded-2xl border border-border p-6 text-center" role="alert">
                    <p className="text-sm text-muted-foreground">{t("loadError")}</p>
                    <Button type="button" onClick={() => void refetch()} className="mt-3">
                        {t("retry")}
                    </Button>
                </div>
            ) : products?.length ? (
                <div className="mt-8 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            description={product.description}
                            price={product.baseSalary + product.profit}
                            discountPercentage={product.discount ?? undefined}
                            discountedPrice={product.unitPrice}
                            counts={product.counts}
                            imageUrl={product.images[0]}
                            reviewSummary={product.reviewSummary}
                            category={`user/category/${product.categoryId}`}
                        />
                    ))}
                </div>
            ) : (
                <p className="mt-8 rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
                    {t("empty")}
                </p>
            )}
        </section>
    );
}