"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareText, Star } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataPagination } from "@/components/admin/DataPagination";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { api } from "@/lib/api";
import { authUserSchema } from "@/lib/validations/login";

const PAGE_SIZE = 10;

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
    avatar: string | null;
  };
  product: {
    id: string;
    title: string;
  };
}

interface ReviewsResponse {
  pagination: {
    totalItems: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
  reviews: Review[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function AdminReviewsDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin.reviews");
  const [page, setPage] = useState(1);

  const authQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<unknown>>("/auth/me");
      const parsed = authUserSchema.safeParse(response.data.data);
      if (!parsed.success) throw new Error("Invalid account response");
      return parsed.data;
    },
    retry: false,
  });
  const isAdmin = authQuery.data?.role === "ADMIN";

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews", locale, page],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReviewsResponse>>("/user/reviews", {
        params: { page, limit: PAGE_SIZE },
      });
      return response.data.data;
    },
    enabled: isAdmin,
    placeholderData: (previousData) => previousData,
  });

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale]
  );
  const reviews = reviewsQuery.data?.reviews ?? [];
  const pagination = reviewsQuery.data?.pagination;

  const columns: DataTableColumn<Review>[] = [
    {
      key: "reviewer",
      header: t("reviewer"),
      className: "min-w-36",
      skeleton: <Skeleton className="h-4 w-28" />,
      cell: (review) => <span className="font-semibold">{review.user.name}</span>,
    },
    {
      key: "product",
      header: t("product"),
      className: "min-w-40",
      skeleton: <Skeleton className="h-4 w-32" />,
      cell: (review) => <span className="font-medium">{review.product.title}</span>,
    },
    {
      key: "rating",
      header: t("rating"),
      className: "whitespace-nowrap",
      skeleton: <Skeleton className="h-4 w-20" />,
      cell: (review) => (
        <span
          className="inline-flex items-center gap-1.5 font-semibold tabular-nums"
          aria-label={t("ratingValue", { rating: review.rating })}
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
          {review.rating} / 5
        </span>
      ),
    },
    {
      key: "comment",
      header: t("comment"),
      className: "min-w-56 max-w-md whitespace-normal",
      skeleton: <Skeleton className="h-4 w-40" />,
      cell: (review) => (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {review.comment || t("noComment")}
        </p>
      ),
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      className: "whitespace-nowrap",
      skeleton: <Skeleton className="h-4 w-28" />,
      cell: (review) => (
        <time dateTime={review.createdAt} className="text-sm text-muted-foreground">
          {dateFormatter.format(new Date(review.createdAt))}
        </time>
      ),
    },
  ];

  if (authQuery.isLoading) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </main>
    );
  }

  if (authQuery.isError || !authQuery.data || !isAdmin) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
        <Alert variant="destructive">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("accessRequired")}</AlertTitle>
          <AlertDescription>{t("accessDescription")}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10" dir="rtl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tracking-wide text-primary">{t("eyebrow")}</p>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">{t("description")}</p>
        </div>
        {pagination && (
          <Badge variant="secondary" className="w-fit tabular-nums">
            {t("reviewCount", { count: pagination.totalItems })}
          </Badge>
        )}
      </header>

      {reviewsQuery.isError ? (
        <Alert variant="destructive">
          <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("loadError")}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{t("loadErrorDescription")}</span>
            <button
              type="button"
              className="font-semibold underline underline-offset-4"
              onClick={() => void reviewsQuery.refetch()}
            >
              {t("retry")}
            </button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-5">
          <DataTable
            columns={columns}
            rows={reviews}
            getRowKey={(review) => review.id}
            emptyMessage={t("empty")}
            loadingMessage={t("loading")}
            isLoading={reviewsQuery.isLoading}
            isRefreshing={reviewsQuery.isFetching && !reviewsQuery.isLoading}
          />
          {pagination && (
            <DataPagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              disabled={reviewsQuery.isFetching}
              previousLabel={t("previous")}
              nextLabel={t("next")}
              navigationLabel={t("paginationLabel")}
              pageLabel={(current, total) => t("page", { current, total })}
            />
          )}
        </div>
      )}
    </main>
  );
}
