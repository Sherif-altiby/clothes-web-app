"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Heart, Minus, Plus, ShoppingCart, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Lens } from "@/components/ui/lens";
import { Button } from "@/components/ui/button";
import { ProductDetailsSkeleton } from "@/components/skeletons/ProductDetailsSkeleton";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useFavourites } from "@/lib/favourites-context";

interface Product {
    id: string;
    title: string;
    description: string;
    baseSalary: number;
    profit: number;
    discount: number | null;
    images: string[];
    counts: number;
    categoryId: string;
    categoryTitle: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function ProductDetails({ productId }: { productId: string }) {
    const locale = useLocale();
    const t = useTranslations("home.productDetails");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCart();
    const { isFavourite, toggleFavourite } = useFavourites();

    const {
        data: product,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["product", locale, productId],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<Product>>(
                `/user/products/${encodeURIComponent(productId)}`,
                {
                    headers: { "Accept-Language": locale },
                    signal,
                }
            );
            return response.data.data;
        },
        enabled: Boolean(productId),
    });

    if (isLoading) {
        return <ProductDetailsSkeleton />;
    }

    if (isError || !product) {
        return (
            <main className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center" role="alert">
                    <p className="text-muted-foreground">{t("loadError")}</p>
                    <Button type="button" onClick={() => void refetch()} className="mt-4">
                        {t("retry")}
                    </Button>
                </div>
            </main>
        );
    }

    const originalPrice = product.baseSalary + product.profit;
    const discountPercentage = product.discount ?? 0;
    const price = originalPrice * (1 - discountPercentage / 100);
    const savings = originalPrice - price;
    const hasDiscount = discountPercentage > 0 && savings > 0;
    const images = product.images;
    const activeImage = images[activeImageIndex];
    const favourite = isFavourite(product.id);
    const categoryHref = `user/category/${product.categoryId}`;
    const maximumQuantity = Math.min(product.counts, 99);

    const handleAddToCart = () => {
        if (maximumQuantity < 1) return;

        void addItem(product.id, Math.min(quantity, maximumQuantity));
    };

    const handleToggleFavourite = () => {
        toggleFavourite({
            id: product.id,
            title: product.title,
            description: product.description,
            price: originalPrice,
            discountPercentage: hasDiscount ? discountPercentage : undefined,
            imageUrl: activeImage ?? "",
            category: categoryHref,
        });
    };

    return (
        <main className="min-h-screen bg-background px-4 py-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href={categoryHref}
                    className="mb-6 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                    {t("backToCategory", { category: product.categoryTitle })}
                </Link>

                <div className="grid items-start gap-10 lg:grid-cols-2">
                    <section aria-label={t("productImages")} className="flex flex-col gap-4">
                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted/30">
                            {hasDiscount && (
                                <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-destructive/90 px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow-lg">
                                    <Tag className="h-3 w-3" />
                                    -{discountPercentage}% {t("off")}
                                </span>
                            )}
                            {activeImage ? (
                                <Lens
                                    key={activeImageIndex}
                                    zoomFactor={2.5}
                                    lensSize={150}
                                    ariaLabel={t("productImages")}
                                    className="w-full"
                                >
                                    <div className="relative aspect-square w-full">
                                        <Image
                                            src={activeImage}
                                            alt={product.title}
                                            fill
                                            priority
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            className="object-cover"
                                        />
                                    </div>
                                </Lens>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t("noImage")}</p>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex flex-wrap justify-center gap-3">
                                {images.map((image, index) => (
                                    <button
                                        key={image}
                                        type="button"
                                        onClick={() => setActiveImageIndex(index)}
                                        aria-label={t("showImage", { number: index + 1 })}
                                        aria-pressed={activeImageIndex === index}
                                        className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                                            activeImageIndex === index
                                                ? "border-primary ring-2 ring-primary/30"
                                                : "border-border/40 opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <Image
                                            src={image}
                                            alt={t("showImage", { number: index + 1 })}
                                            fill
                                            sizes="80px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="flex flex-col gap-6 pt-2">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-2 text-sm text-muted-foreground">{product.categoryTitle}</p>
                                <h1 className="text-2xl font-black leading-tight text-foreground md:text-3xl">
                                    {product.title}
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleFavourite}
                                aria-label={favourite ? t("removeFavourite") : t("addFavourite")}
                                aria-pressed={favourite}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition hover:scale-105 hover:border-destructive/50"
                            >
                                <Heart
                                    className={`h-5 w-5 ${
                                        favourite ? "fill-destructive text-destructive" : "text-muted-foreground"
                                    }`}
                                />
                            </button>
                        </div>

                        <p className="text-base leading-relaxed text-muted-foreground">
                            {product.description}
                        </p>

                        <div className="flex items-end justify-between gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4">
                            <span className="text-xl font-black text-foreground">${price.toFixed(2)}</span>
                            {hasDiscount && (
                                <div className="flex flex-col items-end">
                                    <span className="text-sm text-muted-foreground line-through">
                                        ${originalPrice.toFixed(2)}
                                    </span>
                                    <span className="text-xs font-bold text-destructive">
                                        {t("youSave", { amount: savings.toFixed(2) })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p
                                className={`text-sm font-medium ${
                                    product.counts > 0 ? "text-green-700 dark:text-green-400" : "text-destructive"
                                }`}
                            >
                                {product.counts > 0
                                    ? t("inStock", { count: product.counts })
                                    : t("outOfStock")}
                            </p>

                            <div className="flex h-12 items-center overflow-hidden rounded-xl border border-border">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                                    disabled={quantity <= 1 || maximumQuantity < 1}
                                    aria-label={t("decreaseQuantity")}
                                    className="h-full px-4 text-muted-foreground transition hover:bg-muted/50 disabled:opacity-40"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span aria-live="polite" className="w-10 text-center text-sm font-semibold">
                                    {quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((current) => Math.min(maximumQuantity, current + 1))}
                                    disabled={quantity >= maximumQuantity}
                                    aria-label={t("increaseQuantity")}
                                    className="h-full px-4 text-muted-foreground transition hover:bg-muted/50 disabled:opacity-40"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={maximumQuantity < 1}
                            className="h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-primary/25"
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {t("addToCart")}
                        </Button>
                    </section>
                </div>
            </div>
        </main>
    );
}
