"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { HERO_SLIDES } from "@/lib/home-data";

const AUTOPLAY_MS = 6000;

export function HeroSlider() {
    const t = useTranslations("home.hero");
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef<number | null>(null);
    const count = HERO_SLIDES.length;

    const goTo = (i: number) => setIndex(((i % count) + count) % count);
    const next = () => setIndex((i) => (i + 1) % count);
    const prev = () => setIndex((i) => (i - 1 + count) % count);

    /* Swipe support – direction-aware so it also feels right in RTL */
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) < 50) return;
        const rtl = document.documentElement.dir === "rtl";
        const forward = rtl ? delta > 0 : delta < 0;
        forward ? next() : prev();
    };

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
            {/* Progress animation. The bar's animation end advances the slide,
                so pausing the animation pauses autoplay with no timer drift. */}
            <style>{`
                @keyframes hero-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }
                .hero-progress { transform: scaleX(0); animation-name: hero-progress; animation-timing-function: linear; animation-fill-mode: forwards; }
                @media (prefers-reduced-motion: reduce) { .hero-progress { animation: none; transform: scaleX(1); } }
            `}</style>

            {/* Slides (cross-fade – works identically in LTR and RTL) */}
            {HERO_SLIDES.map((slide, i) => {
                const active = i === index;
                return (
                    <div
                        key={slide.id}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} / ${count}`}
                        aria-hidden={!active}
                        className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
                            }`}
                    >
                        <Image
                            src={slide.image}
                            alt=""
                            fill
                            priority={i === 0}
                            sizes="(max-width: 1280px) 100vw, 1280px"
                            className="object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent rtl:bg-gradient-to-l" />

                        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center gap-5 p-8 text-white md:p-14">
                            <h2 className="text-balance text-3xl font-black leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
                                {t(`slides.${slide.id}.title`)}
                            </h2>
                            <p className="max-w-md text-base text-white/85 md:text-lg">
                                {t(`slides.${slide.id}.subtitle`)}
                            </p>
                            <Button
                                asChild
                                size="lg"
                                className="h-12 w-fit rounded-xl bg-white px-6 text-sm font-bold text-black shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0"
                            >
                                <Link href={slide.href} tabIndex={active ? 0 : -1}>
                                    {t(`slides.${slide.id}.cta`)}
                                </Link>
                            </Button>
                        </div>
                    </div>
                );
            })}

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 p-6 md:p-10">
                <div className="flex items-center gap-2">
                    {HERO_SLIDES.map((slide, i) => (
                        <button
                            key={slide.id}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={t("goTo", { n: i + 1 })}
                            aria-current={i === index}
                            className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/30 transition-all hover:bg-white/50 md:w-14"
                        >
                            {i === index && (
                                <span
                                    key={index}
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
        </section>
    );
}