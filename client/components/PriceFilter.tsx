"use client";

import { useState } from "react";
import { Search, ArrowUpAZ, ArrowDownZA, DollarSign } from "lucide-react";
import { Button } from "./ui/button";

interface PriceFilterProps {
  onSearchChange?: (searchTerm: string) => void;
  onPriceChange?: (min: number, max: number) => void;
  onOrderChange?: (order: "asc" | "desc" | null) => void;
}

export function PriceFilter({
  onSearchChange,
  onPriceChange,
  onOrderChange,
}: PriceFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [activeOrder, setActiveOrder] = useState<"asc" | "desc" | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handlePriceApply = () => {
    if (onPriceChange) {
      onPriceChange(
        minPrice ? Number(minPrice) : 0,
        maxPrice ? Number(maxPrice) : Infinity
      );
    }
  };

  const handleOrderChange = (order: "asc" | "desc") => {
    const newOrder = activeOrder === order ? null : order;
    setActiveOrder(newOrder);
    if (onOrderChange) onOrderChange(newOrder);
  };

  return (
    <div className="w-[350px] rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 shadow-sm transition-all duration-300 hover:shadow-2xl flex flex-col gap-6">
      {/* Search Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Search
        </h3>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search products..."
            className="w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* Price Range Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/60 text-sm font-medium">
              $
            </span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              min="0"
              className="w-full rounded-xl border border-input bg-background/50 pl-7 pr-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>
          <span className="text-muted-foreground/40 font-medium">-</span>
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground/60 text-sm font-medium">
              $
            </span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              min="0"
              className="w-full rounded-xl border border-input bg-background/50 pl-7 pr-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <Button
          onClick={handlePriceApply}
          variant="secondary"
          className="w-full rounded-xl font-medium shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          Apply Price Filter
        </Button>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* Sorting Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          Sort by Price
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={activeOrder === "desc" ? "default" : "outline"}
            onClick={() => handleOrderChange("desc")}
            className={`rounded-xl flex items-center justify-center gap-2 transition-all ${activeOrder === "desc"
              ? "shadow-md shadow-primary/20"
              : "hover:border-primary/40 hover:bg-primary/5"
              }`}
          >
            <ArrowDownZA className="h-4 w-4" />
            <span className="text-sm font-medium">Highest</span>
          </Button>
          <Button
            variant={activeOrder === "asc" ? "default" : "outline"}
            onClick={() => handleOrderChange("asc")}
            className={`rounded-xl flex items-center justify-center gap-2 transition-all ${activeOrder === "asc"
              ? "shadow-md shadow-primary/20"
              : "hover:border-primary/40 hover:bg-primary/5"
              }`}
          >
            <ArrowUpAZ className="h-4 w-4" />
            <span className="text-sm font-medium">Lowest</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
