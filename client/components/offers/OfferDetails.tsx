"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { OfferId } from "@/lib/offers";
import { getOffer } from "@/lib/offers";

interface Category {
    id: string;
    title: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function OfferDetails({ offerId }: { offerId: OfferId }) {
    const offer = getOffer(offerId);
    const locale = useLocale();
    const t = useTranslations("home.offers");
    const tCategories = useTranslations("home.categories");
    const {
        data: categories,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["categories", locale],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<Category[]>>("/user/categories", {
                headers: { "Accept-Language": locale },
                signal,
            });

            return response.data.data;
        },
        staleTime: 5 * 60_000,
    });

    const categoryTitle = tCategories(offer.category);
    const category = categories?.find(
        (item) => item.title.toLocaleLowerCase(locale) === categoryTitle.toLocaleLowerCase(locale),
    );

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
                <div className="relative min-h-[320px] bg-muted sm:min-h-[440px] lg:min-h-[600px]">
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
                        <span className="text-xs font-extrabold uppercase tracking-widest">
                            {t("off")}
                        </span>
                    </span>
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                    <span className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        <Tag className="h-4 w-4" aria-hidden="true" />
                        {t("limitedOffer")}
                    </span>
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        {t(`campaigns.${offer.id}.title`)}
                    </h1>
                    <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                        {t(`campaigns.${offer.id}.description`)}
                    </p>

                    <div className="mt-8 rounded-2xl bg-muted/60 p-5">
                        <p className="text-sm font-semibold text-foreground">
                            {t("categoryLabel")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{categoryTitle}</p>
                    </div>

                    {isError ? (
                        <div className="mt-6" role="alert">
                            <p className="text-sm text-destructive">{t("categoryLoadError")}</p>
                            <Button
                                type="button"
                                variant="link"
                                className="mt-1 h-auto p-0"
                                onClick={() => void refetch()}
                            >
                                {t("categoryRetry")}
                            </Button>
                        </div>
                    ) : category ? (
                        <Button
                            asChild
                            size="lg"
                            className="mt-8 h-12 w-full rounded-xl font-bold sm:w-fit sm:min-w-52"
                        >
                            <Link href={`/${locale}/user/category/${category.id}`}>
                                {t("browseCategory")}
                                <ArrowUpRight className="ms-2 h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                            </Link>
                        </Button>
                    ) : isLoading ? (
                        <Button type="button" size="lg" disabled className="mt-8 h-12 w-full rounded-xl sm:w-fit">
                            {t("loadingCategory")}
                        </Button>
                    ) : (
                        <p className="mt-6 text-sm text-muted-foreground" role="status">
                            {t("categoryUnavailable")}
                        </p>
                    )}
                </div>
            </article>
        </main>
    );
}
