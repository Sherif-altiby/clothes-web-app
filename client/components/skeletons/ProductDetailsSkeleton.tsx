export function ProductDetailsSkeleton() {
    return (
        <main className="min-h-screen bg-background px-4 py-10" aria-label="Loading product" aria-busy="true">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="grid items-start gap-10 lg:grid-cols-2">
                    <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
                    <div className="flex flex-col gap-6">
                        <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-24 animate-pulse rounded bg-muted" />
                        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                        <div className="h-12 animate-pulse rounded-xl bg-muted" />
                        <div className="h-12 animate-pulse rounded-xl bg-muted" />
                    </div>
                </div>
            </div>
        </main>
    );
}
