"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    Heart,
    Minus,
    Plus,
    RefreshCw,
    ShoppingCart,
    Star,
    Tag,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ProductDetailsSkeleton } from "@/components/skeletons/ProductDetailsSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lens } from "@/components/ui/lens";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useFavourites } from "@/lib/favourites-context";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    title: string;
    description: string;
    baseSalary: number;
    profit: number;
    discount: number | null;
    images: string[];
    counts: number;
    categoryId: string;
    categoryTitle: string;
    reviews: Review[];
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

const LOW_STOCK_THRESHOLD = 5;
const MAX_QUANTITY_PER_ORDER = 99;

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function StarRating({
    rating,
    className,
}: {
    rating: number;
    className?: string;
}) {
    return (
        <div className="flex items-center gap-0.5" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => (
                <Star
                    key={index}
                    className={cn(
                        "h-4 w-4",
                        index < Math.round(rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30",
                        className
                    )}
                />
            ))}
        </div>
    );
}

export function ProductDetails({ productId }: { productId: string }) {
    const locale = useLocale();
    const t = useTranslations("home.productDetails");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCart();
    const { isFavourite, toggleFavourite } = useFavourites();

    const {
        data: product,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ["product", locale, productId],
        queryFn: async ({ signal }) => {
            const response = await api.get<ApiResponse<Product>>(
                `/user/products/${encodeURIComponent(productId)}`,
                {
                    headers: { "Accept-Language": locale },
                    signal,
                }
            );
            return response.data.data;
        },
        enabled: Boolean(productId),
    });

    const currency = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: "currency",
                currency: "USD",
            }),
        [locale]
    );

    const dateFormatter = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
        [locale]
    );

    // Rating summary is derived once per product instead of on every render.
    const ratingSummary = useMemo(() => {
        const reviews = product?.reviews ?? [];
        const total = reviews.length;
        const average = total
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
            : 0;
        const distribution = [5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter(
                (review) => Math.round(review.rating) === stars
            ).length;
            return { stars, count, percent: total ? (count / total) * 100 : 0 };
        });
        return { total, average, distribution };
    }, [product?.reviews]);

    if (isLoading) {
        return <ProductDetailsSkeleton />;
    }

    if (isError || !product) {
        return (
            <main className="container mx-auto px-4 py-16">
                <Alert variant="destructive" className="mx-auto max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col items-start gap-4">
                        <span>{t("loadError")}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isRefetching}
                            onClick={() => void refetch()}
                            className="gap-2"
                        >
                            <RefreshCw
                                className={cn("h-4 w-4", isRefetching && "animate-spin")}
                            />
                            {t("retry")}
                        </Button>
                    </AlertDescription>
                </Alert>
            </main>
        );
    }

    const originalPrice = product.baseSalary + product.profit;
    const discountPercentage = product.discount ?? 0;
    const price = originalPrice * (1 - discountPercentage / 100);
    const savings = originalPrice - price;
    const hasDiscount = discountPercentage > 0 && savings > 0;

    const images = product.images;
    const safeImageIndex = Math.min(activeImageIndex, Math.max(images.length - 1, 0));
    const activeImage = images[safeImageIndex];

    const favourite = isFavourite(product.id);
    // Leading slash added: the original relative href resolved against the current route.
    const categoryHref = `/user/category/${product.categoryId}`;

    const maximumQuantity = Math.min(product.counts, MAX_QUANTITY_PER_ORDER);
    const inStock = maximumQuantity >= 1;
    const isLowStock = inStock && product.counts <= LOW_STOCK_THRESHOLD;
    // Clamp so the stepper stays valid if stock changes after a refetch.
    const safeQuantity = inStock ? Math.min(Math.max(quantity, 1), maximumQuantity) : 1;

    const handleAddToCart = () => {
        if (!inStock) return;
        void addItem(product.id, safeQuantity);
    };

    const handleToggleFavourite = () => {
        toggleFavourite({
            id: product.id,
            title: product.title,
            description: product.description,
            price: originalPrice,
            discountPercentage: hasDiscount ? discountPercentage : undefined,
            imageUrl: activeImage ?? "",
            category: categoryHref,
        });
    };

    return (
        <TooltipProvider delayDuration={200}>
            <main className="min-h-screen bg-background px-4 py-8 md:py-10">
                <div className="mx-auto max-w-6xl">
                    <Breadcrumb className="mb-6">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href="/">{t("breadcrumbHome")}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={categoryHref}>{product.categoryTitle}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem className="min-w-0">
                                <BreadcrumbPage className="max-w-[16rem] truncate">
                                    {product.title}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* Gallery */}
                        <section
                            aria-label={t("productImages")}
                            className="flex flex-col gap-4 lg:sticky lg:top-24"
                        >
                            <Card className="relative overflow-hidden rounded-2xl border-border/60 bg-muted/30 p-0 shadow-none">
                                {hasDiscount && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute start-4 top-4 z-10 gap-1.5 px-3 py-1 text-xs font-bold shadow-md"
                                    >
                                        <Tag className="h-3 w-3" aria-hidden="true" />
                                        {t("discountBadge", { percent: discountPercentage })}
                                    </Badge>
                                )}

                                {activeImage ? (
                                    <Lens
                                        key={safeImageIndex}
                                        zoomFactor={2.5}
                                        lensSize={150}
                                        ariaLabel={t("productImages")}
                                        className="w-full"
                                    >
                                        <div className="relative aspect-square w-full">
                                            <Image
                                                src={activeImage}
                                                alt={product.title}
                                                fill
                                                priority
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                                className="object-cover"
                                            />
                                        </div>
                                    </Lens>
                                ) : (
                                    <div className="flex aspect-square w-full items-center justify-center">
                                        <p className="text-sm text-muted-foreground">
                                            {t("noImage")}
                                        </p>
                                    </div>
                                )}
                            </Card>

                            {images.length > 1 && (
                                <div
                                    className="flex flex-wrap justify-center gap-3"
                                    role="group"
                                    aria-label={t("productImages")}
                                >
                                    {images.map((image, index) => {
                                        const isActive = safeImageIndex === index;
                                        return (
                                            <button
                                                key={image}
                                                type="button"
                                                onClick={() => setActiveImageIndex(index)}
                                                aria-label={t("showImage", { number: index + 1 })}
                                                aria-pressed={isActive}
                                                className={cn(
                                                    "relative h-20 w-20 overflow-hidden rounded-xl border-2 transition",
                                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    isActive
                                                        ? "border-primary ring-2 ring-primary/30"
                                                        : "border-border/40 opacity-70 hover:opacity-100"
                                                )}
                                            >
                                                <Image
                                                    src={image}
                                                    alt=""
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Purchase panel */}
                        <section className="flex flex-col gap-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <Badge variant="secondary" asChild>
                                        <Link href={categoryHref}>{product.categoryTitle}</Link>
                                    </Badge>
                                    <h1 className="text-2xl font-black leading-tight text-foreground md:text-3xl">
                                        {product.title}
                                    </h1>
                                    {ratingSummary.total > 0 && (
                                        <a
                                            href="#reviews-heading"
                                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            <StarRating rating={ratingSummary.average} />
                                            <span className="font-semibold text-foreground">
                                                {ratingSummary.average.toFixed(1)}
                                            </span>
                                            <span>
                                                {t("reviewCount", { count: ratingSummary.total })}
                                            </span>
                                        </a>
                                    )}
                                </div>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={handleToggleFavourite}
                                            aria-label={
                                                favourite ? t("removeFavourite") : t("addFavourite")
                                            }
                                            aria-pressed={favourite}
                                            className="h-11 w-11 shrink-0 rounded-full hover:border-destructive/50"
                                        >
                                            <Heart
                                                className={cn(
                                                    "h-5 w-5 transition",
                                                    favourite
                                                        ? "fill-destructive text-destructive"
                                                        : "text-muted-foreground"
                                                )}
                                            />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {favourite ? t("removeFavourite") : t("addFavourite")}
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
                                {product.description}
                            </p>

                            <Separator />

                            {/* Price */}
                            <Card className="rounded-2xl border-border/40 bg-muted/30 shadow-none">
                                <CardContent className="flex items-end justify-between gap-3 p-4">
                                    <div>
                                        <p className="sr-only">{t("price")}</p>
                                        <span className="text-3xl font-black tabular-nums text-foreground">
                                            {currency.format(price)}
                                        </span>
                                    </div>
                                    {hasDiscount && (
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-sm tabular-nums text-muted-foreground line-through">
                                                {currency.format(originalPrice)}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="border-destructive/40 text-xs font-bold text-destructive"
                                            >
                                                {t("youSave", { amount: currency.format(savings) })}
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Stock + quantity */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "gap-2 px-3 py-1.5 text-sm font-medium",
                                        !inStock && "border-destructive/40 text-destructive",
                                        isLowStock &&
                                            "border-amber-500/50 text-amber-700 dark:text-amber-400",
                                        inStock &&
                                            !isLowStock &&
                                            "border-green-600/40 text-green-700 dark:text-green-400"
                                    )}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "h-2 w-2 rounded-full",
                                            !inStock && "bg-destructive",
                                            isLowStock && "bg-amber-500",
                                            inStock && !isLowStock && "bg-green-600"
                                        )}
                                    />
                                    {!inStock
                                        ? t("outOfStock")
                                        : isLowStock
                                          ? t("lowStock", { count: product.counts })
                                          : t("inStock", { count: product.counts })}
                                </Badge>

                                <div
                                    className="flex h-12 items-center rounded-xl border border-border"
                                    role="group"
                                    aria-label={t("quantity")}
                                >
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setQuantity((current) => Math.max(1, current - 1))
                                        }
                                        disabled={safeQuantity <= 1 || !inStock}
                                        aria-label={t("decreaseQuantity")}
                                        className="h-full rounded-s-xl rounded-e-none"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span
                                        aria-live="polite"
                                        className="w-10 text-center text-sm font-semibold tabular-nums"
                                    >
                                        {safeQuantity}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setQuantity((current) =>
                                                Math.min(maximumQuantity, current + 1)
                                            )
                                        }
                                        disabled={safeQuantity >= maximumQuantity}
                                        aria-label={t("increaseQuantity")}
                                        className="h-full rounded-s-none rounded-e-xl"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className="h-12 w-full gap-2 rounded-xl text-sm font-bold"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {inStock
                                    ? t("addToCartWithTotal", {
                                          total: currency.format(price * safeQuantity),
                                      })
                                    : t("outOfStock")}
                            </Button>
                        </section>
                    </div>

                    {/* Reviews */}
                    <section className="mt-14" aria-labelledby="reviews-heading">
                        <Separator className="mb-8" />

                        <h2
                            id="reviews-heading"
                            className="mb-6 scroll-mt-24 text-2xl font-black text-foreground"
                        >
                            {t("reviewsTitle")}
                        </h2>

                        {ratingSummary.total > 0 ? (
                            <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
                                <Card className="h-fit rounded-2xl shadow-none">
                                    <CardContent className="space-y-4 p-5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl font-black tabular-nums">
                                                {ratingSummary.average.toFixed(1)}
                                            </span>
                                            <div className="space-y-1">
                                                <StarRating rating={ratingSummary.average} />
                                                <p className="text-sm text-muted-foreground">
                                                    {t("reviewCount", { count: ratingSummary.total })}
                                                </p>
                                            </div>
                                        </div>

                                        <ul className="space-y-2">
                                            {ratingSummary.distribution.map(
                                                ({ stars, count, percent }) => (
                                                    <li
                                                        key={stars}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <span className="flex w-8 shrink-0 items-center gap-1 tabular-nums text-muted-foreground">
                                                            {stars}
                                                            <Star
                                                                className="h-3 w-3 fill-amber-400 text-amber-400"
                                                                aria-hidden="true"
                                                            />
                                                        </span>
                                                        <Progress
                                                            value={percent}
                                                            className="h-2 flex-1"
                                                            aria-label={t("ratingBreakdown", {
                                                                stars,
                                                                count,
                                                            })}
                                                        />
                                                        <span className="w-6 shrink-0 text-end tabular-nums text-muted-foreground">
                                                            {count}
                                                        </span>
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </CardContent>
                                </Card>

                                <ul className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                    {product.reviews.map((review) => (
                                        <li key={review.id}>
                                            <Card className="h-full rounded-2xl shadow-none">
                                                <CardContent className="p-5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                {review.user.avatar && (
                                                                    <AvatarImage
                                                                        src={review.user.avatar}
                                                                        alt=""
                                                                    />
                                                                )}
                                                                <AvatarFallback className="text-xs font-semibold">
                                                                    {getInitials(review.user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-foreground">
                                                                    {review.user.name}
                                                                </p>
                                                                <time
                                                                    className="text-xs text-muted-foreground"
                                                                    dateTime={review.createdAt}
                                                                >
                                                                    {dateFormatter.format(
                                                                        new Date(review.createdAt)
                                                                    )}
                                                                </time>
                                                            </div>
                                                        </div>
                                                        <div
                                                            role="img"
                                                            aria-label={t("reviewRating", {
                                                                rating: review.rating,
                                                            })}
                                                        >
                                                            <StarRating rating={review.rating} />
                                                        </div>
                                                    </div>

                                                    {review.comment && (
                                                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                                            {review.comment}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <Card className="rounded-2xl border-dashed shadow-none">
                                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                    {t("noReviews")}
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </main>
        </TooltipProvider>
    );
}