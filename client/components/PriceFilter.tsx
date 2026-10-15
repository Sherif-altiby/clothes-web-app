"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ArrowUpAZ,
  ArrowDownZA,
  X,
  Check,
  RotateCcw,
  SlidersHorizontal,
  PackageOpen,
  AlertCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "./ui/button";

interface Category {
  id: string;
  title: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PriceFilterProps {
  selectedCategoryId: string;
  orderPrice?: "asc" | "desc";
  onSearchChange: (searchTerm: string) => void;
  onOrderChange: (order: "asc" | "desc" | undefined) => void;
  onCategoryChange: (categoryId: string) => void;
}

export function PriceFilter({
  selectedCategoryId,
  orderPrice,
  onSearchChange,
  onOrderChange,
  onCategoryChange,
}: PriceFilterProps) {
  const locale = useLocale();
  const t = useTranslations("home.filters");

  // ----- Debounced search (300ms) -----
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["categories", locale],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Category[]>>(
        "/user/categories",
        { headers: { "Accept-Language": locale } }
      );
      return response.data.data;
    },
    staleTime: 5 * 60_000,
  });

  const hasCategories = useMemo(
    () => Array.isArray(categories) && categories.length > 0,
    [categories]
  );

  const isSortActive = orderPrice === "asc" || orderPrice === "desc";

  return (
    <aside
      aria-label={t("search")}
      className="
        flex w-full flex-col gap-6 rounded-2xl border border-border/40
        bg-card/70 p-5 backdrop-blur-xl transition-all duration-300
        hover:shadow-md lg:sticky lg:top-6 lg:w-[320px] lg:p-6
      "
    >
      {/* ---------- Header ---------- */}
      <header className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          {t("search") /* "Filters" */}
        </h2>
      </header>

      {/* ---------- Search ---------- */}
      <div className="space-y-3">
        <label
          htmlFor="product-search"
          className="text-xs font-semibold tracking-wide text-foreground/60 uppercase"
        >
          {t("search")}
        </label>
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="product-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="
              w-full rounded-xl border border-input bg-background/60
              py-2.5 pe-10 ps-10 text-sm outline-none transition-all
              placeholder:text-muted-foreground/60
              focus:border-primary focus:bg-background
              focus:ring-4 focus:ring-primary/10
            "
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="
                absolute inset-y-0 end-2 flex items-center rounded-md px-2
                text-muted-foreground transition-colors hover:text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-border/60" />

      {/* ---------- Categories ---------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
            {t("category")}
          </h3>
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className="text-[11px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("clearSort") /* or add "clear" key */}
            </button>
          )}
        </div>

        {isLoading ? (
          <div
            className="flex flex-wrap gap-2"
            aria-label={t("loadingCategories")}
            aria-busy="true"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-muted-foreground">{t("categoriesError")}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-1 inline-flex items-center gap-1 font-semibold text-foreground underline underline-offset-4 hover:text-primary"
              >
                <RotateCcw className="h-3 w-3" />
                {t("retry")}
              </button>
            </div>
          </div>
        ) : !hasCategories ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
            <PackageOpen className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              {t("noCategories") /* "No categories found" */}
            </p>
          </div>
        ) : (
          <div
            role="group"
            aria-label={t("category")}
            className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pe-1"
          >
            {categories!.map((category) => {
              const isActive = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onCategoryChange(category.id)}
                  aria-pressed={isActive}
                  className={`
                    group inline-flex min-w-0 items-center gap-1.5 rounded-xl
                    border px-3 py-2 text-xs font-medium transition-all
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-primary/40
                    ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    }
                  `}
                >
                  {isActive && <Check className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{category.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px w-full bg-border/60" />

      {/* ---------- Sort by price ---------- */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-foreground/60 uppercase">
          {t("sortByPrice")}
        </h3>

        <div
          role="radiogroup"
          aria-label={t("sortByPrice")}
          className="grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={orderPrice === "desc"}
            onClick={() => onOrderChange("desc")}
            className={`
              inline-flex items-center justify-center gap-2 rounded-xl border
              px-3 py-2.5 text-xs font-medium transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
              ${
                orderPrice === "desc"
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5"
              }
            `}
          >
            <ArrowDownZA className="h-4 w-4" />
            {t("highest")}
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={orderPrice === "asc"}
            onClick={() => onOrderChange("asc")}
            className={`
              inline-flex items-center justify-center gap-2 rounded-xl border
              px-3 py-2.5 text-xs font-medium transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
              ${
                orderPrice === "asc"
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background/60 text-foreground/80 hover:border-primary/40 hover:bg-primary/5"
              }
            `}
          >
            <ArrowUpAZ className="h-4 w-4" />
            {t("lowest")}
          </button>
        </div>

        {isSortActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOrderChange(undefined)}
            className="w-full gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("clearSort")}
          </Button>
        )}
      </div>
    </aside>
  );
}