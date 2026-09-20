"use client";

import { useEffect, useState } from "react";
import { Check, Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useFavourites } from "@/lib/favourites-context";

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
  onAddToCart?: (id: string) => void;
  onToggleFavourite?: (id: string, isFav: boolean) => void;
  category: string;
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
  onAddToCart,
  onToggleFavourite,
  category,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { isFavourite: isSaved, toggleFavourite } = useFavourites();
  const isFavourite = isSaved(id);

  const displayPrice = discountPercentage
    ? price - (price * discountPercentage) / 100
    : price;
  const displayOriginal = originalPrice || (discountPercentage ? price : null);

  // Show a check mark on the button for a moment after adding
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFav = toggleFavourite({
      id,
      title,
      description,
      price,
      originalPrice,
      discountPercentage,
      imageUrl,
      rating,
      reviewsCount,
      category,
    });
    if (onToggleFavourite) onToggleFavourite(id, newFav);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // the card is a <Link>, so don't navigate
    e.stopPropagation();

    addItem({
      id,
      title,
      price: displayPrice, // final price after discount
      originalPrice: displayOriginal,
      imageUrl,
      category,
    });

    setJustAdded(true);
    if (onAddToCart) onAddToCart(id);
  };

  return (
    <Link
      href={`${category}/${id}`}
      className="group relative w-full max-w-sm rounded-3xl border border-border/50 bg-card/40 p-3 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)] overflow-hidden"
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
        aria-pressed={isFavourite}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${
            isFavourite
              ? "fill-destructive text-destructive scale-110"
              : "scale-100"
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
                className={`h-3 w-3 ${
                  i < Math.floor(rating)
                    ? "fill-current"
                    : "fill-transparent text-muted-foreground/30"
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

          {/* Add to Cart */}
          <Button
            size="icon"
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="h-10 w-10 shrink-0 rounded-full shadow-md transition-all duration-300 hover:shadow-lg active:scale-90"
          >
            {justAdded ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
}