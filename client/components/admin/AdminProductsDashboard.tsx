"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Edit3,
  ImageOff,
  Package,
  PackageSearch,
  Plus,
  RefreshCw,
  ShieldAlert,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { authUserSchema } from "@/lib/validations/login";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DataPagination } from "./DataPagination";
import { ProductEditorDialog } from "./ProductEditorDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { SharedSelect } from "@/components/shared/SharedSelect";
import { SharedActionButton } from "@/components/shared/SharedActionButton";
import {
  getCloudinaryPublicId,
  type AdminCategory,
  type AdminProduct,
  type ApiResponse,
  type ProductFormData,
  type ProductPagination,
} from "./types";
import { SearchInput } from "../shared/search-input";

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 5;
const ADMIN_PRODUCTS_QUERY_KEY = ["admin-products"] as const;
const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

interface ProductsPage {
  pagination: ProductPagination;
  products: AdminProduct[];
}

interface UploadedImage {
  url: string;
  publicId: string;
}

interface ProductSaveVariables {
  product: AdminProduct | null;
  isCreate: boolean;
  data: ProductFormData;
  newFiles: File[];
  removedPublicIds: string[];
}

const getApiErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;

const deleteImages = async (publicIds: string[]) => {
  const results = await Promise.allSettled(
    [...new Set(publicIds)].map((publicId) =>
      api.delete("/upload", { data: { publicId } })
    )
  );
  return results.filter((result) => result.status === "rejected").length;
};

const uploadImages = async (files: File[]): Promise<UploadedImage[]> => {
  if (!files.length) return [];

  const formData = new FormData();
  const multiple = files.length > 1;
  const fieldName = multiple ? "images" : "image";
  files.forEach((file) => formData.append(fieldName, file));

  if (multiple) {
    const response = await api.post<ApiResponse<UploadedImage[]>>(
      "/upload/multiple",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.data;
  }

  const response = await api.post<ApiResponse<UploadedImage>>(
    "/upload/single",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return [response.data.data];
};

function StockBadge({ count, outOfStockLabel }: { count: number; outOfStockLabel: string }) {
  const isOut = count < 1;
  const isLow = !isOut && count <= LOW_STOCK_THRESHOLD;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium tabular-nums",
        isOut && "border-destructive/40 text-destructive",
        isLow && "border-amber-500/50 text-amber-700 dark:text-amber-400",
        !isOut && !isLow && "text-foreground"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOut ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-green-600"
        )}
      />
      {isOut ? outOfStockLabel : count}
    </Badge>
  );
}

function IconActionButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={className}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function AdminProductsDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin.products");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editorSession, setEditorSession] = useState(0);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchTitle(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const authQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<ApiResponse<unknown>>("/auth/me");
      const parsed = authUserSchema.safeParse(response.data.data);
      if (!parsed.success) throw new Error("Invalid account response");
      return parsed.data;
    },
    retry: false,
  });
  const isAdmin = authQuery.data?.role === "ADMIN";

  const productsQuery = useQuery({
    queryKey: [...ADMIN_PRODUCTS_QUERY_KEY, page, searchTitle, categoryFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProductsPage>>("/admin/product", {
        params: {
          page,
          limit: PAGE_SIZE,
          searchTitle: searchTitle || undefined,
          categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        },
      });
      return response.data.data;
    },
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", locale],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminCategory[]>>("/user/categories");
      return response.data.data;
    },
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ product, isCreate, data, newFiles, removedPublicIds }: ProductSaveVariables) => {
      const uploaded: UploadedImage[] = await uploadImages(newFiles);
      const payload = {
        ...data,
        images: [...data.images, ...uploaded.map((image) => image.url)],
      };

      try {
        if (isCreate) {
          await api.post("/admin/product", payload);
        } else if (product) {
          await api.patch(`/admin/product/${encodeURIComponent(product.id)}`, payload);
        } else {
          throw new Error("Product is required to update");
        }
      } catch (error) {
        if (uploaded.length) {
          const cleanupFailures = await deleteImages(uploaded.map((image) => image.publicId));
          if (cleanupFailures) {
            toast.error(t("uploadCleanupFailed", { count: cleanupFailures }));
          }
        }
        throw error;
      }

      const cleanupFailures = await deleteImages(isCreate ? [] : removedPublicIds);
      return { cleanupFailures, isCreate };
    },
    onSuccess: ({ cleanupFailures, isCreate }) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
      setIsCreateOpen(false);
      setEditingProduct(null);
      toast.success(t(isCreate ? "createSuccess" : "saveSuccess"));
      if (cleanupFailures) toast.warning(t("imageCleanupFailed", { count: cleanupFailures }));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("saveError"))),
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: AdminProduct) => {
      await api.delete(`/admin/product/${encodeURIComponent(product.id)}`);
      const publicIds = product.images.flatMap((url) => {
        const publicId = getCloudinaryPublicId(url);
        return publicId ? [publicId] : [];
      });
      return deleteImages(publicIds);
    },
    onSuccess: (cleanupFailures) => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_QUERY_KEY });
      const remainingProducts = Math.max(
        0,
        (productsQuery.data?.pagination.totalItems ?? 1) - 1
      );
      setPage((current) =>
        Math.min(current, Math.max(1, Math.ceil(remainingProducts / PAGE_SIZE)))
      );
      setDeletingProduct(null);
      toast.success(t("deleteSuccess"));
      if (cleanupFailures) toast.warning(t("imageCleanupFailed", { count: cleanupFailures }));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("deleteError"))),
  });

  const categories: AdminCategory[] = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        ...category,
        title: category.title || (locale === "ar" ? category.titleAr : category.titleEn) || "",
      })),
    [categoriesQuery.data, locale]
  );
  const categoryTitleById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.title])),
    [categories]
  );
  const currency = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }),
    [locale]
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  );

  const getProductTitle = (product: AdminProduct) =>
    locale === "ar" ? product.titleAr : product.titleEn || product.titleAr;
  const getCategoryTitle = (product: AdminProduct) =>
    categoryTitleById.get(product.categoryId) ?? product.category.titleAr;

  const columns: DataTableColumn<AdminProduct>[] = [
    {
      key: "product",
      header: t("product"),
      className: "min-w-64",
      skeleton: (
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ),
      cell: (product) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
            {product.images[0] ? (
              <Image src={product.images[0]} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-semibold text-foreground">{getProductTitle(product)}</p>
            {/* Secondary info for narrow screens where the columns are hidden */}
            <Badge
              variant="outline"
              className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{getCategoryTitle(product)}</span>
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: t("price"),
      className: "whitespace-nowrap",
      cell: (product) => {
        const original = product.baseSalary + product.profit;
        const discount = product.discount ?? 0;
        const final = original * (1 - discount / 100);

        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold tabular-nums text-foreground">{currency.format(final)}</span>
            {discount > 0 && (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="tabular-nums text-muted-foreground line-through">
                  {currency.format(original)}
                </span>
                <Badge
                  variant="outline"
                  dir="ltr"
                  className="h-5 border-destructive/40 px-1.5 text-[11px] font-semibold text-destructive"
                >
                  -{discount}%
                </Badge>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "quantity",
      header: t("quantity"),
      cell: (product) => (
        <StockBadge count={product.counts} outOfStockLabel={t("outOfStock")} />
      ),
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      className: "whitespace-nowrap",
      cell: (product) => (
        <time dateTime={product.createdAt} className="text-sm text-muted-foreground">
          {dateFormatter.format(new Date(product.createdAt))}
        </time>
      ),
    },
    {
      key: "rating",
      header: t("rating"),
      className: "whitespace-nowrap",
      skeleton: <Skeleton className="h-5 w-20" />,
      cell: (product) => (
        product.reviewSummary.totalReviews > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
            <span className="font-semibold">{product.reviewSummary.averageRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewSummary.totalReviews})
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t("noRatings")}</span>
        )
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t("actions")}</span>,
      className: "w-px text-end",
      skeleton: <Skeleton className="ms-auto h-8 w-16" />,
      cell: (product) => (
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={t("editProduct", { name: getProductTitle(product) })}
            onClick={() => {
              setIsCreateOpen(false);
              setEditingProduct(product);
              setEditorSession((current) => current + 1);
            }}
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </IconActionButton>
          <IconActionButton
            label={t("deleteProduct", { name: getProductTitle(product) })}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingProduct(product)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconActionButton>
        </div>
      ),
    },
  ];

  if (authQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12" aria-busy="true">
        <span role="status" className="sr-only">
          {t("checkingAccess")}
        </span>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[28rem] w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (authQuery.isError || !authQuery.data) {
    const returnTo = encodeURIComponent(`/${locale}/admin`);
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t("accessRequired")}</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-4">
            {t("signInRequired")}
            <Button asChild size="sm">
              <Link href={`/${locale}/login?returnTo=${returnTo}`}>{t("signIn")}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t("accessRequired")}</AlertTitle>
          <AlertDescription className="mt-2">{t("adminOnly")}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const products = productsQuery.data?.products ?? [];
  const pagination = productsQuery.data?.pagination;
  const isRefreshing = productsQuery.isFetching && !productsQuery.isLoading;

  return (
    <TooltipProvider delayDuration={200}>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {t("title")}
              </h1>
              <Badge variant="secondary" className="gap-1.5 tabular-nums">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                {t("productCount", { count: pagination?.totalItems ?? 0 })}
              </Badge>
            </div>
            <p className="max-w-xl text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <SharedActionButton
            type="button"
            icon={<Plus />}
            onClick={() => {
              setEditingProduct(null);
              setIsCreateOpen(true);
              setEditorSession((current) => current + 1);
            }}
          >
            {t("createProduct")}
          </SharedActionButton>
        </header>

        <Card className="relative gap-0 overflow-hidden rounded-xl py-0 shadow-none">
          {/* Thin activity bar while refetching */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            {isRefreshing && <div className="h-full w-1/3 animate-pulse bg-primary" />}
          </div>
          {isRefreshing && (
            <span role="status" className="sr-only">
              {t("updating")}
            </span>
          )}

          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">{t("productsTitle")}</CardTitle>
              <CardDescription>{t("productsDescription")}</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                clearLabel={t("clearSearch")}
                maxLength={100}
              />
              <SharedSelect
                value={categoryFilter}
                onValueChange={(value) => {
                  setCategoryFilter(value);
                  setPage(1);
                }}
                options={[
                  { value: "all", label: t("allCategories") },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.title,
                  })),
                ]}
                placeholder={t("allCategories")}
                className="w-full sm:max-w-xs"
                aria-label={t("categoryFilter")}
              />
            </div>
          </div>

          {productsQuery.isError ? (
            <div className="p-4 sm:p-6">
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{t("loadError")}</AlertTitle>
                <AlertDescription className="mt-2 flex flex-wrap items-center justify-between gap-4">
                  {t("loadErrorDescription")}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => void productsQuery.refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              {categoriesQuery.isError && (
                <div className="border-b border-border p-4 sm:px-6">
                  <Alert variant="destructive">
                    <AlertTitle>{t("categoriesError")}</AlertTitle>
                    <AlertDescription className="mt-1">{t("categoriesErrorDescription")}</AlertDescription>
                  </Alert>
                </div>
              )}

              <DataTable
                className="rounded-none border-0"
                columns={columns}
                rows={products}
                getRowKey={(product) => product.id}
                isLoading={productsQuery.isLoading}
                isRefreshing={isRefreshing}
                skeletonRows={PAGE_SIZE / 2}
                loadingMessage={t("loading")}
                emptyIcon={<PackageSearch className="h-5 w-5" aria-hidden="true" />}
                emptyMessage={searchTitle || categoryFilter !== "all" ? t("noSearchResults") : t("noProducts")}
              />

              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-border bg-muted/20 px-4 py-3 sm:px-6">
                  <DataPagination
                    page={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    disabled={productsQuery.isFetching}
                    onPageChange={setPage}
                    previousLabel={t("previous")}
                    nextLabel={t("next")}
                    navigationLabel={t("paginationLabel")}
                    pageLabel={(current, total) => t("page", { current, total })}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        <ProductEditorDialog
          key={editorSession}
          open={Boolean(editingProduct) || isCreateOpen}
          isCreate={isCreateOpen}
          product={editingProduct}
          categories={categories}
          isSaving={saveMutation.isPending}
          labels={{
            title: t(isCreateOpen ? "createTitle" : "editTitle"),
            description: t(isCreateOpen ? "createDescription" : "editDescription"),
            submit: t("createProduct"),
            close: t("close"),
            titleEn: t("titleEn"),
            titleAr: t("titleAr"),
            descriptionEn: t("descriptionEn"),
            descriptionAr: t("descriptionAr"),
            baseSalary: t("baseSalary"),
            profit: t("profit"),
            discount: t("discount"),
            counts: t("inventory"),
            category: t("category"),
            images: t("images"),
            addImages: t("addImages"),
            cancel: t("cancel"),
            save: t("save"),
            saving: t("saving"),
            invalidForm: t("invalidForm"),
            saveError: t("saveError"),
            invalidImageType: t("invalidImageType"),
            fileTooLarge: t("fileTooLarge"),
            selectCategory: t("selectCategory"),
            noCategories: t("noCategories"),
            tooManyImages: t("tooManyImages"),
            removeImage: t("removeImage"),
            sectionDetails: t("sectionDetails"),
            sectionPricing: t("sectionPricing"),
            sectionImages: t("sectionImages"),
            finalPrice: t("finalPrice"),
            mainImage: t("mainImage"),
            dropImages: t("dropImages"),
          }}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProduct(null);
              setIsCreateOpen(false);
            }
          }}
          onSave={async (data, newFiles, removedPublicIds) => {
            await saveMutation.mutateAsync({
              product: editingProduct,
              isCreate: isCreateOpen,
              data,
              newFiles,
              removedPublicIds,
            });
          }}
        />

        <ConfirmDeleteDialog
          open={Boolean(deletingProduct)}
          isDeleting={deleteMutation.isPending}
          title={t("confirmDeleteTitle")}
          description={deletingProduct
            ? t("confirmDeleteDescription", { name: getProductTitle(deletingProduct) })
            : ""}
          cancelLabel={t("cancel")}
          confirmLabel={t("delete")}
          deletingLabel={t("deleting")}
          itemName={deletingProduct ? getProductTitle(deletingProduct) : undefined}
          itemImage={deletingProduct?.images[0]}
          dir={locale === "ar" ? "rtl" : "ltr"}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
          onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct)}
        />
      </main>
    </TooltipProvider>
  );
}