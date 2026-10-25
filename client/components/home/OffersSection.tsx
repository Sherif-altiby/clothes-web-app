"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { OFFER_CAMPAIGNS } from "@/lib/offers";

interface Category {
    id: string;
    title: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function OffersSection() {
    const t = useTranslations("home.offers");
    const tCategories = useTranslations("home.categories");
    const locale = useLocale();
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

    const offers = categories
        ? OFFER_CAMPAIGNS.flatMap((offer) => {
              const categoryTitle = tCategories(offer.category);
              const category = categories.find(
                  (item) => item.title.toLocaleLowerCase(locale) === categoryTitle.toLocaleLowerCase(locale),
              );

              return category ? [{ ...offer, categoryId: category.id }] : [];
          })
        : [];

    return (
        <section className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl space-y-2">
                        
                    <h2 className="text-2xl  tracking-tight text-foreground md:text-3xl font-bold">
                        {t("title")}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground md:text-base">
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-5 md:grid-cols-3" role="status" aria-label={t("loading")}>
                    {OFFER_CAMPAIGNS.map((offer) => (
                        <div
                            key={offer.id}
                            className="aspect-[4/5] animate-pulse rounded-3xl bg-muted md:aspect-[4/5]"
                        />
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-border p-6 text-center" role="alert">
                    <p className="text-sm text-muted-foreground">{t("loadError")}</p>
                    <button
                        type="button"
                        onClick={() => void refetch()}
                        className="mt-3 text-sm font-semibold text-foreground underline underline-offset-4"
                    >
                        {t("retry")}
                    </button>
                </div>
            ) : offers.length ? (
                <div className="grid gap-5 md:grid-cols-3">
                    {offers.map((offer) => (
                        <Link
                            key={offer.id}
                            href={`/${locale}/user/offers/${offer.id}`}
                            className="group relative isolate min-h-[360px] overflow-hidden rounded-3xl bg-muted shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 md:aspect-[4/5] md:min-h-0"
                        >
                            <Image
                                src={offer.image}
                                alt=""
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

                            <span className="absolute end-5 top-5 inline-flex items-baseline gap-1 rounded-2xl border border-white/25 bg-white/95 px-4 py-2 text-foreground shadow-lg backdrop-blur-sm">
                                <span className="text-3xl font-black tracking-tight">{offer.discount}%</span>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                                    {t("off")}
                                </span>
                            </span>

                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white md:p-7">
                                <div className="min-w-0">
                                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                                        {t("limitedOffer")}
                                    </p>
                                    <h3 className="text-2xl font-black tracking-tight md:text-3xl">
                                        {t(`campaigns.${offer.id}.title`)}
                                    </h3>
                                    <p className="mt-2 max-w-xs text-sm leading-6 text-white/80">
                                        {t(`campaigns.${offer.id}.description`)}
                                    </p>
                                </div>
                                <span className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md transition duration-300 group-hover:bg-white group-hover:text-foreground">
                                    <ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
                                    <span className="sr-only">{t("shopNow")}</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {t("empty")}
                </p>
            )}
        </section>
    );
}
