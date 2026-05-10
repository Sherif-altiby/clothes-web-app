"use client";

import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";

export interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl: string;
  rating?: number;
  reviewsCount?: number;
  initialIsFavourite?: boolean;
  onAddToCart?: (id: string) => void;
  onToggleFavourite?: (id: string, isFav: boolean) => void;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  originalPrice,
  discountPercentage,
  imageUrl,
  rating = 4.5,
  reviewsCount = 128,
  initialIsFavourite = false,
  onAddToCart,
  onToggleFavourite,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavourite, setIsFavourite] = useState(initialIsFavourite);

  const displayPrice = discountPercentage ? price - (price * discountPercentage / 100) : price;
  const displayOriginal = originalPrice || (discountPercentage ? price : null);

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFav = !isFavourite;
    setIsFavourite(newFav);
    if (onToggleFavourite) onToggleFavourite(id, newFav);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(id);
  };

  return (
    <div
      className="group relative w-full max-w-sm rounded-3xl border border-border/50 bg-card/40 p-3 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {discountPercentage && (
        <div className="absolute left-6 top-6 z-10 flex h-8 items-center justify-center rounded-full bg-destructive/90 px-3 text-xs font-bold text-destructive-foreground shadow-lg backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
          -{discountPercentage}% OFF
        </div>
      )}

      {/* Favourite Button (Floating) */}
      <button
        onClick={handleToggleFavourite}
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-background hover:text-destructive hover:scale-110 active:scale-95"
        aria-label="Toggle Favourite"
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${isFavourite ? "fill-destructive text-destructive scale-110" : "scale-100"
            }`}
        />
      </button>

      {/* Image Container */}
      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl bg-muted/30">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Subtle overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Quick Add Button (appears on hover) */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 opacity-0 translate-y-4 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0">
          <Button
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-background/90 text-foreground backdrop-blur-md hover:bg-background shadow-lg transition-transform active:scale-95 gap-2 font-semibold"
            variant="secondary"
          >
            <ShoppingCart className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col gap-2 p-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
              {title}
            </h3>
            <p className="line-clamp-1 text-sm text-muted-foreground/80">
              {description}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-current" : "fill-transparent text-muted-foreground/30"
                  }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            ({reviewsCount})
          </span>
        </div>

        {/* Price & Actions */}
        <div className="mt-2 flex items-end justify-between">
          <div className="flex flex-col">
            {displayOriginal && (
              <span className="text-xs font-medium text-muted-foreground line-through decoration-destructive/50">
                ${displayOriginal.toFixed(2)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight text-foreground">
                ${displayPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Main Add to Cart Button (Mobile visible, Desktop hides on hover as quick add appears) */}
          <Button
            size="icon"
            onClick={handleAddToCart}
            className="h-10 w-10 shrink-0 rounded-full shadow-md transition-all duration-300 hover:shadow-lg active:scale-90 md:group-hover:opacity-0 md:group-hover:scale-75"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
