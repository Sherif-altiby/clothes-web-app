"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Star, Heart, Tag, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lens } from "@/components/ui/lens"; // Magic UI Lens (installed via shadcn CLI)

const PRODUCT_IMAGES = [
    {
        id: 1,
        src: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=90",
        alt: "Jacket – front view",
    },
    {
        id: 2,
        src: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=1200&q=90",
        alt: "Jacket – side view",
    },
    {
        id: 3,
        src: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1200&q=90",
        alt: "Jacket – detail",
    },
];

const PRODUCT = {
    name: "Urban Explorer Jacket",
    description:
        "Crafted for the modern adventurer, this premium jacket combines technical performance with effortless style. Featuring a water-resistant outer shell, cozy inner fleece lining, and thoughtfully placed pockets for all your essentials.",
    price: 189.99,
    originalPrice: 249.99,
    reviewsCount: 128,
    averageRating: 4.2,
};

/* ─── Star rating component ──────────────────────────────────── */
function StarRating({
    value,
    onChange,
    size = "md",
}: {
    value: number;
    onChange?: (v: number) => void;
    size?: "sm" | "md" | "lg";
}) {
    const [hovered, setHovered] = useState(0);
    const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
    const active = hovered || value;

    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => onChange && setHovered(star)}
                    onMouseLeave={() => onChange && setHovered(0)}
                    className={`transition-transform duration-150 ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
                >
                    <Star
                        className={`${sizeClass} transition-colors duration-150 ${star <= active
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-muted-foreground/30"
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ProductPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFav, setIsFav] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const discount = Math.round(
        ((PRODUCT.originalPrice - PRODUCT.price) / PRODUCT.originalPrice) * 100
    );

    const handleRate = (v: number) => {
        setUserRating(v);
        setRatingSubmitted(false);
    };

    const handleSubmitRating = () => {
        if (userRating > 0) setRatingSubmitted(true);
    };

    const activeImage = PRODUCT_IMAGES[activeIndex];

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-6xl mx-auto">

                {/* ── Two-column grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

                    {/* ══ LEFT – Image Gallery ══ */}
                    <div className="flex flex-col gap-4">

                        {/* Main image + Lens */}
                        <div className="relative">
                            {/* Discount badge */}
                            <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 bg-destructive/90 text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm pointer-events-none">
                                <Tag className="h-3 w-3" />
                                -{discount}% OFF
                            </div>

                            <Lens
                                key={activeIndex} // reset lens state when the image changes
                                zoomFactor={2.5}
                                lensSize={150}
                                isStatic={false}
                                ariaLabel={`Zoom ${activeImage.alt}`}
                            >
                                {/* Lens needs a child with real dimensions,
                                    so we give it a square box and fill it */}
                                <div className="relative w-full aspect-square">
                                    <Image
                                        src={activeImage.src}
                                        alt={activeImage.alt}
                                        fill
                                        className="object-cover select-none"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        priority
                                    />
                                </div>
                            </Lens>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex justify-center gap-3">
                            {PRODUCT_IMAGES.map((img, i) => (
                                <button
                                    key={img.id}
                                    id={`thumbnail-${i}`}
                                    onClick={() => setActiveIndex(i)}
                                    aria-label={img.alt}
                                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300
                                        ${activeIndex === i
                                            ? "border-primary scale-105 shadow-md ring-2 ring-primary/30"
                                            : "border-border/40 opacity-55 hover:opacity-90 hover:border-primary/50 hover:scale-105"
                                        }`}
                                >
                                    <Image
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ══ RIGHT – Product Details ══ */}
                    <div className="flex flex-col gap-6 pt-2">

                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                            <h1 className="text-sm md:text-lg lg:text-2xl xl:text-3xl font-black tracking-tight text-primary leading-tight">
                                {PRODUCT.name}
                            </h1>
                            {/* Favourite */}
                            <button
                                id="btn-favourite"
                                onClick={() => setIsFav((p) => !p)}
                                aria-label="Toggle favourite"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all duration-300 hover:scale-110 hover:border-destructive/50 active:scale-95"
                            >
                                <Heart
                                    className={`h-5 w-5 transition-colors duration-300 ${isFav ? "fill-destructive text-destructive" : "text-muted-foreground"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Rating summary */}
                        <div className="flex items-center gap-3">
                            <StarRating value={Math.round(PRODUCT.averageRating)} size="md" />
                            <span className="text-sm font-semibold text-foreground">
                                {PRODUCT.averageRating.toFixed(1)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                ({PRODUCT.reviewsCount} reviews)
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-base text-muted-foreground leading-relaxed text-justify">
                            {PRODUCT.description}
                        </p>

                        {/* Price */}
                        <div className="flex justify-between items-end gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40">
                            <span className="text-md lg:text-lg xl:text-xl font-black text-foreground">
                                ${PRODUCT.price.toFixed(2)}
                            </span>
                            <div className="flex flex-col pb-1">
                                <span className="text-sm text-muted-foreground line-through">
                                    ${PRODUCT.originalPrice.toFixed(2)}
                                </span>
                                <span className="text-xs font-bold text-destructive">
                                    You save ${(PRODUCT.originalPrice - PRODUCT.price).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Quantity + Add to Cart */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-0 rounded-xl border border-border overflow-hidden h-12">
                                <button
                                    id="btn-qty-minus"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="px-4 h-full text-lg font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center font-semibold text-foreground text-sm">
                                    {quantity}
                                </span>
                                <button
                                    id="btn-qty-plus"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="px-4 h-full text-lg font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            <Button
                                id="btn-add-to-cart"
                                size="lg"
                                className="flex-1 p-4 rounded-xl h-12 text-sm font-bold gap-2 shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                            </Button>
                        </div>

                        {/* Perks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { icon: Truck, label: "Free Shipping", sub: "Orders over $100" },
                                { icon: Shield, label: "2-Year Warranty", sub: "Full coverage" },
                            ].map(({ icon: Icon, label, sub }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        <p className="text-xs text-muted-foreground">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── User Rating Section ── */}
                        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-3">
                            <p className="text-sm font-bold text-foreground">Rate this product</p>
                            <div className="flex items-center gap-4">
                                <StarRating value={userRating} onChange={handleRate} size="lg" />
                                {userRating > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][userRating]}
                                    </span>
                                )}
                            </div>
                            {!ratingSubmitted ? (
                                <Button
                                    id="btn-submit-rating"
                                    size="sm"
                                    variant="outline"
                                    disabled={userRating === 0}
                                    onClick={handleSubmitRating}
                                    className="rounded-lg transition-all duration-200"
                                >
                                    Submit Rating
                                </Button>
                            ) : (
                                <p className="text-sm font-medium text-primary animate-in fade-in duration-300">
                                    ✓ Thanks for your {userRating}-star rating!
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}