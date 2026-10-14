"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { HeroSliderSkeleton } from "@/components/skeletons/HeroSliderSkeleton";
import { api } from "@/lib/api";

const AUTOPLAY_MS = 6000;

interface HeroSlide {
    id: string;
    image: string;
    href: string;
    order: number;
    isActive: boolean;
    title: string;
    subtitle: string;
    cta: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

function getLocalizedHref(href: string, locale: string) {
    if (/^https?:\/\//i.test(href)) return href;
    if (href === `/${locale}` || href.startsWith(`/${locale}/`)) return href;
    return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export function HeroSlider() {
    const t = useTranslations("home.hero");
    const locale = useLocale();
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const {
        data: slides,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["hero-slides", locale],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<HeroSlide[]>>("/user/hero-slides", {
                headers: { "Accept-Language": locale },
                signal,
            });

            return response.data.data
                .filter((slide) => slide.isActive)
                .sort((a, b) => a.order - b.order);
        },
        staleTime: 5 * 60_000,
    });

    const count = slides?.length ?? 0;
    const goTo = (slideIndex: number) => {
        if (count > 0) setIndex(((slideIndex % count) + count) % count);
    };
    const next = () => goTo(index + 1);
    const prev = () => goTo(index - 1);

    const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
    };

    const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
        if (touchStartX.current === null) return;

        const delta = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 50) return;

        const rtl = document.documentElement.dir === "rtl";
        const forward = rtl ? delta > 0 : delta < 0;
        if (forward) next();
        else prev();
    };

    if (isLoading) return <HeroSliderSkeleton />;

    if (isError) {
        return (
            <section
                aria-label={t("label")}
                className="flex h-[460px] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-border/50 bg-muted/30 p-6 text-center shadow-xl md:h-[560px]"
                role="alert"
            >
                <p className="text-muted-foreground">{t("loadError")}</p>
                <Button type="button" onClick={() => void refetch()}>
                    {t("retry")}
                </Button>
            </section>
        );
    }

    if (!slides?.length) {
        return (
            <section
                aria-label={t("label")}
                className="flex h-[460px] w-full items-center justify-center rounded-3xl border border-border/50 bg-muted/30 p-6 text-center md:h-[560px]"
            >
                <p className="text-muted-foreground">{t("empty")}</p>
            </section>
        );
    }

    const activeIndex = index % count;

    return (
        <section
            aria-roledescription="carousel"
            aria-label={t("label")}
            className="relative h-[460px] w-full overflow-hidden rounded-3xl border border-border/50 bg-muted/30 shadow-xl md:h-[560px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <style>{`
                @keyframes hero-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }
                .hero-progress { transform: scaleX(0); animation-name: hero-progress; animation-timing-function: linear; animation-fill-mode: forwards; }
                @media (prefers-reduced-motion: reduce) { .hero-progress { animation: none; transform: scaleX(1); } }
            `}</style>

            {slides.map((slide, slideIndex) => {
                const active = slideIndex === activeIndex;

                return (
                    <div
                        key={slide.id}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${slideIndex + 1} / ${count}`}
                        aria-hidden={!active}
                        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                            active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
                        }`}
                    >
                        <Image
                            src={slide.image}
                            alt=""
                            fill
                            priority={slideIndex === 0}
                            sizes="(max-width: 1280px) 100vw, 1280px"
                            className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent rtl:bg-gradient-to-l" />

                        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center gap-5 p-8 text-white md:p-14">
                            <h2 className="text-balance text-3xl font-black leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                                {slide.title}
                            </h2>
                            <p className="max-w-md text-base text-white/85 md:text-lg">
                                {slide.subtitle}
                            </p>
                            <Button
                                asChild
                                size="lg"
                                className="h-12 w-fit rounded-xl bg-white px-6 text-sm font-bold text-black shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0"
                            >
                                <Link href={getLocalizedHref(slide.href, locale)} tabIndex={active ? 0 : -1}>
                                    {slide.cta}
                                </Link>
                            </Button>
                        </div>
                    </div>
                );
            })}

            {count > 1 && (
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 p-6 md:p-10">
                    <div className="flex items-center gap-2">
                        {slides.map((slide, slideIndex) => (
                            <button
                                key={slide.id}
                                type="button"
                                onClick={() => goTo(slideIndex)}
                                aria-label={t("goTo", { n: slideIndex + 1 })}
                                aria-current={slideIndex === activeIndex}
                                className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/30 transition-all hover:bg-white/50 md:w-14"
                            >
                                {slideIndex === activeIndex && (
                                    <span
                                        key={activeIndex}
                                        className="hero-progress absolute inset-0 origin-left rounded-full bg-white rtl:origin-right"
                                        style={{
                                            animationDuration: `${AUTOPLAY_MS}ms`,
                                            animationPlayState: paused ? "paused" : "running",
                                        }}
                                        onAnimationEnd={next}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={prev}
                            aria-label={t("prev")}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-background active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            aria-label={t("next")}
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-background active:scale-95"
                        >
                            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
