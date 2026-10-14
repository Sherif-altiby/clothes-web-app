"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpAZ, ArrowDownZA } from "lucide-react";
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
  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["categories", locale],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Category[]>>("/user/categories", {
        headers: { "Accept-Language": locale },
      });
      return response.data.data;
    },
    staleTime: 5 * 60_000,
  });

  return (
    <aside className="flex w-full flex-col gap-6 rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl transition-shadow hover:shadow-xs lg:w-[300px]">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          {t("search")}
        </h2>
        <label className="group relative block">
          <span className="absolute inset-y-0 start-3 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="w-full rounded-xl border border-input bg-background/50 py-2.5 pe-4 ps-10 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <div className="h-px w-full bg-border/60" />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          {t("category")}
        </h2>
        {isLoading ? (
          <div className="space-y-2" aria-label={t("loadingCategories")} aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="text-sm text-muted-foreground">
            <p>{t("categoriesError")}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-1 font-semibold text-foreground underline underline-offset-4"
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories?.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedCategoryId === category.id ? "default" : "outline"}
                onClick={() => onCategoryChange(category.id)}
                aria-pressed={selectedCategoryId === category.id}
                className="min-w-0 flex-1 rounded-xl"
              >
                <span className="truncate">{category.title}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="h-px w-full bg-border/60" />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-foreground/80 uppercase">
          {t("sortByPrice")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={orderPrice === "desc" ? "default" : "outline"}
            onClick={() => onOrderChange("desc")}
            className="rounded-xl"
          >
            <ArrowDownZA className="h-4 w-4" />
            {t("highest")}
          </Button>
          <Button
            type="button"
            variant={orderPrice === "asc" ? "default" : "outline"}
            onClick={() => onOrderChange("asc")}
            className="rounded-xl"
          >
            <ArrowUpAZ className="h-4 w-4" />
            {t("lowest")}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOrderChange(undefined)}
          className="w-full"
        >
          {t("clearSort")}
        </Button>
      </div>
    </aside>
  );
}
