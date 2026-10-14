export function CategorySkeleton() {
    return (
        <div
            aria-label="Loading categories"
            aria-busy="true"
            className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
            {Array.from({ length: 6 }, (_, index) => (
                <div
                    key={index}
                    className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
                />
            ))}
        </div>
    );
}
