"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
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
  const [searchTitle, setSearchTitle] = useState("");
  const [orderPrice, setOrderPrice] = useState<"asc" | "desc">();
  const [page, setPage] = useState(1);
  const handleSearchChange = useCallback((searchTerm: string) => {
    setSearchTitle(searchTerm.trim());
    setPage(1);
  }, []);

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
          onSearchChange={handleSearchChange}
          onOrderChange={handleOrderChange}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <section className="min-w-0 flex-1" aria-label={t("results")}>
        {isLoading || isFetching ? (
          <div className="space-y-4" role="status" aria-label={t("updating")}>
            {!isLoading && (
              <p className="text-sm font-medium text-muted-foreground">{t("updating")}</p>
            )}
            <ProductSkeleton />
          </div>
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
                    category={`user/category/${selectedCategoryId}`}
                  />
                ))}
              </div>
            </div>

            {data.pagination.totalPages > 1 && (
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
            )}
          </>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-gradient-to-b from-muted/50 to-background px-6 py-12 text-center shadow-sm">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-inner">
              <SearchX className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t("empty")}
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t("emptyHint")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
