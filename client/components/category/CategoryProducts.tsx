"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { PriceFilter } from "@/components/PriceFilter";
import { ProductCard } from "@/components/ProductCard";
import { ProductSkeleton } from "@/components/skeletons/ProductSkeleton";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ApiProduct {
  id: string;
  title: string;
  description: string;
  baseSalary: number;
  profit: number;
  discount: number | null;
  counts: number;
  images: string[];
  categoryId: string;
}

interface ProductsResponse {
  pagination: {
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
  products: ApiProduct[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface CategoryProductsProps {
  categoryId: string;
}

export function CategoryProducts({ categoryId }: CategoryProductsProps) {
  const locale = useLocale();
  const t = useTranslations("home.products");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const [searchInput, setSearchInput] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [orderPrice, setOrderPrice] = useState<"asc" | "desc">();
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTitle(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["products", locale, selectedCategoryId, searchTitle, orderPrice, page],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProductsResponse>>("/user/products", {
        params: {
          categoryId: selectedCategoryId,
          searchTitle: searchTitle || undefined,
          orderPrice,
          page,
        },
        headers: { "Accept-Language": locale },
      });

      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const handleCategoryChange = (nextCategoryId: string) => {
    setSelectedCategoryId(nextCategoryId);
    setPage(1);
  };

  const handleOrderChange = (nextOrder: "asc" | "desc" | undefined) => {
    setOrderPrice(nextOrder);
    setPage(1);
  };

  return (
    <div className="mt-10 flex flex-col gap-6 lg:flex-row">
      <div className="h-fit shrink-0 lg:sticky lg:top-20">
        <PriceFilter
          selectedCategoryId={selectedCategoryId}
          orderPrice={orderPrice}
          onSearchChange={setSearchInput}
          onOrderChange={handleOrderChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <section className="min-w-0 flex-1" aria-label={t("results")}>
        {isLoading ? (
          <ProductSkeleton />
        ) : isError ? (
          <div role="alert" className="rounded-2xl border border-border p-6 text-center">
            <p className="text-muted-foreground">{t("loadError")}</p>
            <Button type="button" onClick={() => void refetch()} className="mt-4">
              {t("retry")}
            </Button>
          </div>
        ) : data?.products.length ? (
          <>
            <div className="relative">
              {isFetching && (
                <p className="absolute -top-6 end-0 text-xs text-muted-foreground" role="status">
                  {t("updating")}
                </p>
              )}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    description={product.description}
                    price={product.baseSalary + product.profit}
                    discountPercentage={product.discount ?? undefined}
                    counts={product.counts}
                    imageUrl={product.images[0]}
                    category={`/${locale}/user/category/${selectedCategoryId}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("page", { current: data.pagination.currentPage, total: data.pagination.totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= data.pagination.totalPages || isFetching}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                {t("next")}
              </Button>
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-border p-8 text-center text-muted-foreground">
            {t("empty")}
          </p>
        )}
      </section>
    </div>
  );
}
