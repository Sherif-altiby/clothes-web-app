"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Offer {
    id: string;
    title: string;
    description: string;
    image: string;
    discount: number;
    endsAt: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function OffersSection() {
    const t = useTranslations("home.offers");
    const locale = useLocale();
    const { data: offers, isLoading, isError, refetch } = useQuery({
        queryKey: ["offers", locale],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<Offer[]>>("/user/offers", {
                headers: { "Accept-Language": locale },
                signal,
            });
            return response.data.data;
        },
        staleTime: 60_000,
        refetchInterval: 30_000,
    });

    return (
        <section className="container mx-auto px-4 py-12 md:py-16">
            <div className="mb-8 max-w-xl space-y-2 sm:mb-10">
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {t("title")}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                    {t("subtitle")}
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label={t("loading")}>
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
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
            ) : offers?.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
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
                                        {offer.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 max-w-xs text-sm leading-6 text-white/80">
                                        {offer.description}
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
