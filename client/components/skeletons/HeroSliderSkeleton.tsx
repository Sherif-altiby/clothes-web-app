export function HeroSliderSkeleton() {
    return (
        <div
            aria-label="Loading featured slides"
            aria-busy="true"
            className="h-[460px] w-full animate-pulse rounded-3xl border border-border/50 bg-muted/50 shadow-xl md:h-[560px]"
        />
    );
}
