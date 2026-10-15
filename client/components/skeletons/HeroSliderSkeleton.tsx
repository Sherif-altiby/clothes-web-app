export function HeroSliderSkeleton() {
    return (
        <div
            aria-label="Loading featured slides"
            aria-busy="true"
            className="h-[calc(100svh-4rem)] w-full animate-pulse bg-muted/50 shadow-xl"
        />
    );
}
