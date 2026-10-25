"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { ProductSkeleton } from "@/components/skeletons/ProductSkeleton";
import { api } from "@/lib/api";

interface OfferProduct {
    id: string;
    title: string;
    description: string;
    images: string[];
    categoryId: string;
    counts: number;
    originalUnitPrice: number;
    unitPrice: number;
    discountPercentage: number;
}

interface Offer {
    id: string;
    title: string;
    description: string;
    image: string;
    discount: number;
    startsAt: string;
    endsAt: string;
    products: OfferProduct[];
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function OfferDetails({ offerId }: { offerId: string }) {
    const locale = useLocale();
    const t = useTranslations("home.offers");
    const { data: offer, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ["offer", locale, offerId],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<Offer>>(
                `/user/offers/${encodeURIComponent(offerId)}`,
                { headers: { "Accept-Language": locale }, signal },
            );
            return response.data.data;
        },
        enabled: Boolean(offerId),
    });
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

    if (isLoading) {
        return (
            <main className="container mx-auto px-4 py-10">
                <div className="h-[420px] animate-pulse rounded-3xl bg-muted" />
                <div className="mt-12">
                    <ProductSkeleton count={3} />
                </div>
            </main>
        );
    }

    if (isError || !offer) {
        return (
            <main className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-lg rounded-3xl border border-border p-8 text-center">
                    <h1 className="text-xl font-bold text-foreground">{t("unavailableTitle")}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{t("unavailableDescription")}</p>
                    <div className="mt-5 flex justify-center gap-3">
                        <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
                            <RefreshCw className={`me-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                            {t("retry")}
                        </Button>
                        <Button asChild>
                            <Link href={`/${locale}/user`}>{t("backToOffers")}</Link>
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 py-8 md:py-12">
            <Link
                href={`/${locale}/user`}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                {t("backToOffers")}
            </Link>

            <article className="grid overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:grid-cols-2">
                <div className="relative min-h-[320px] bg-muted sm:min-h-[440px] lg:min-h-[560px]">
                    <Image
                        src={offer.image}
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    <span className="absolute end-5 top-5 inline-flex items-baseline gap-1 rounded-2xl border border-white/25 bg-white/95 px-5 py-3 text-foreground shadow-lg backdrop-blur-sm sm:end-7 sm:top-7">
                        <span className="text-4xl font-black tracking-tight">{offer.discount}%</span>
                        <span className="text-xs font-extrabold uppercase tracking-widest">{t("off")}</span>
                    </span>
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                    <span className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        {t("limitedOffer")}
                    </span>
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        {offer.title}
                    </h1>
                    <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                        {offer.description}
                    </p>
                    <p className="mt-6 text-sm font-medium text-muted-foreground">
                        {t("validUntil", { date: dateFormatter.format(new Date(offer.endsAt)) })}
                    </p>
                </div>
            </article>

            <section className="mt-12 md:mt-16" aria-labelledby="offer-products-title">
                <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                        <h2 id="offer-products-title" className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                            {t("productsTitle")}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t("productsCount", { count: offer.products.length })}
                        </p>
                    </div>
                </div>

                {offer.products.length ? (
                    <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {offer.products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.title}
                                description={product.description}
                                price={product.originalUnitPrice}
                                discountPercentage={product.discountPercentage || undefined}
                                discountedPrice={product.unitPrice}
                                counts={product.counts}
                                imageUrl={product.images[0] ?? ""}
                                category={`user/category/${product.categoryId}`}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        {t("noProducts")}
                    </p>
                )}
            </section>
        </main>
    );
}
