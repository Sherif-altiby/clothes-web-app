"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Edit3, ImageOff, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { authUserSchema } from "@/lib/validations/login";
import { getCloudinaryPublicId } from "./types";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import type { ApiResponse } from "./types";
import {
  CategoryEditorDialog,
  type CategoryFormData,
  type EditableCategory,
} from "./CategoryEditorDialog";

const CATEGORY_QUERY_KEY = ["categories"] as const;

interface UploadedImage {
  url: string;
  publicId: string;
}

interface CategorySaveVariables {
  category: EditableCategory | null;
  data: CategoryFormData;
  imageFile: File | null;
}

const getApiErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;

const deleteImage = async (publicId: string) => {
  await api.delete("/upload", { data: { publicId } });
};

const uploadImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await api.post<ApiResponse<UploadedImage>>(
    "/upload/single",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
};

export function AdminCategoriesDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin.categories");
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EditableCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<EditableCategory | null>(null);

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

  const categoriesQuery = useQuery({
    queryKey: [...CATEGORY_QUERY_KEY, locale],
    queryFn: async () => {
      const response = await api.get<ApiResponse<EditableCategory[]>>("/user/categories");
      return response.data.data;
    },
    enabled: isAdmin,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ category, data, imageFile }: CategorySaveVariables) => {
      if (!category && !imageFile) {
        throw new Error("A category image is required");
      }
      let uploaded: UploadedImage | null = null;
      if (imageFile) uploaded = await uploadImage(imageFile);

      try {
        const payload = {
          ...data,
          ...(uploaded ? { image: uploaded.url } : {}),
        };
        if (category) {
          await api.patch(`/admin/category/${encodeURIComponent(category.id)}`, payload);
        } else {
          await api.post("/admin/category", payload);
        }
      } catch (error) {
        if (uploaded) {
          try {
            await deleteImage(uploaded.publicId);
          } catch {
            toast.error(t("imageCleanupError"));
          }
        }
        throw error;
      }

      let cleanupFailed = false;
      if (category && uploaded) {
        const oldImagePublicId = getCloudinaryPublicId(category.image);
        if (oldImagePublicId) {
          try {
            await deleteImage(oldImagePublicId);
          } catch {
            cleanupFailed = true;
          }
        }
      }
      return { isCreate: !category, cleanupFailed };
    },
    onSuccess: ({ isCreate, cleanupFailed }) => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditorOpen(false);
      setEditingCategory(null);
      toast.success(t(isCreate ? "createSuccess" : "updateSuccess"));
      if (cleanupFailed) toast.error(t("imageCleanupError"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("saveError"))),
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: EditableCategory) => {
      await api.delete(`/admin/category/${encodeURIComponent(category.id)}`);
      const imagePublicId = getCloudinaryPublicId(category.image);
      if (imagePublicId) {
        try {
          await deleteImage(imagePublicId);
          return false;
        } catch {
          return true;
        }
      }
      return false;
    },
    onSuccess: (cleanupFailed) => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setDeletingCategory(null);
      toast.success(t("deleteSuccess"));
      if (cleanupFailed) toast.error(t("imageCleanupError"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("deleteError"))),
  });

  const categories = categoriesQuery.data ?? [];
  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  );

  const columns: DataTableColumn<EditableCategory>[] = [
    {
      key: "image",
      header: t("image"),
      className: "w-20",
      skeleton: <Skeleton className="h-12 w-12 rounded-xl" />,
      cell: (category) => (
        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
          {category.image ? (
            <Image src={category.image} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <ImageOff className="m-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      ),
    },
    {
      key: "titleAr",
      header: t("titleAr"),
      className: "min-w-40",
      cell: (category) => <span className="font-semibold">{category.titleAr}</span>,
    },
    {
      key: "titleEn",
      header: t("titleEn"),
      className: "min-w-40",
      cell: (category) => <span dir="ltr">{category.titleEn}</span>,
    },
    {
      key: "products",
      header: t("products"),
      className: "whitespace-nowrap",
      cell: (category) => (
        <Badge variant="secondary" className="tabular-nums">
          {category._count?.products ?? 0}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("createdAt"),
      className: "whitespace-nowrap",
      cell: (category) => (
        <time dateTime={category.createdAt} className="text-sm text-muted-foreground">
          {formatter.format(new Date(category.createdAt))}
        </time>
      ),
    },
    {
      key: "actions",
      header: t("actions"),
      className: "w-24",
      cell: (category) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("editCategory", { name: category.title })}
            onClick={() => {
              setEditingCategory(category);
              setEditorOpen(true);
            }}
          >
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("deleteCategory", { name: category.title })}
            onClick={() => setDeletingCategory(category)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
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
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t("accessRequired")}</AlertTitle>
          <AlertDescription>{t("accessDescription")}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          type="button"
          className="gap-2 self-start sm:self-auto"
          onClick={() => {
            setEditingCategory(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("create")}
        </Button>
      </header>

      <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <CardTitle className="text-base font-semibold">{t("tableTitle")}</CardTitle>
          <CardDescription className="mt-1">{t("tableDescription")}</CardDescription>
        </div>
        {categoriesQuery.isError ? (
          <div className="p-4 sm:p-6">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{t("loadError")}</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-4">
                {t("loadErrorDescription")}
                <Button type="button" size="sm" variant="outline" onClick={() => void categoriesQuery.refetch()}>
                  {t("retry")}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <DataTable
            className="rounded-none border-0 shadow-none"
            columns={columns}
            rows={categories}
            getRowKey={(category) => category.id}
            isLoading={categoriesQuery.isLoading}
            isRefreshing={categoriesQuery.isFetching && !categoriesQuery.isLoading}
            loadingMessage={t("loading")}
            emptyMessage={t("empty")}
            skeletonRows={5}
          />
        )}
      </Card>

      <CategoryEditorDialog
        key={editingCategory?.id ?? (editorOpen ? "new-category" : "closed")}
        open={editorOpen}
        category={editingCategory}
        isSaving={saveMutation.isPending}
        labels={{
          createTitle: t("createTitle"),
          editTitle: t("editTitle"),
          description: t("formDescription"),
          titleAr: t("titleAr"),
          titleEn: t("titleEn"),
          image: t("image"),
          chooseImage: t("chooseImage"),
          cancel: t("cancel"),
          create: t("create"),
          save: t("save"),
          saving: t("saving"),
          requiredFields: t("requiredFields"),
          saveError: t("saveError"),
          invalidImageType: t("invalidImageType"),
          fileTooLarge: t("fileTooLarge"),
        }}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSave={(data, imageFile) =>
          saveMutation.mutateAsync({ category: editingCategory, data, imageFile }).then(() => {})
        }
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingCategory)}
        isDeleting={deleteMutation.isPending}
        title={t("confirmDeleteTitle")}
        description={
          deletingCategory
            ? t("confirmDeleteDescription", { name: deletingCategory.title })
            : ""
        }
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        deletingLabel={t("deleting")}
        itemName={deletingCategory?.title}
        itemImage={deletingCategory?.image}
        dir={locale === "ar" ? "rtl" : "ltr"}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory)}
      />
    </main>
  );
}
