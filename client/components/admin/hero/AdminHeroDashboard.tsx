"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { SharedActionButton } from "@/components/shared/SharedActionButton";
import { api } from "@/lib/api";
import { authUserSchema } from "@/lib/validations/login";
 import {
  HeroEditorDialog,
  emptyDraft,
  type HeroSlide,
  type HeroSlideDraft,
} from "./HeroEditorDialog";
import { HeroSlidesTable } from "./HeroSlidesTable";
import { ApiResponse, getCloudinaryPublicId } from "../types";

const HERO_SLIDES_QUERY_KEY = ["admin-hero-slides"] as const;

interface UploadedImage {
  url: string;
  publicId: string;
}

interface SaveHeroSlideVariables {
  slide: HeroSlide | null;
  draft: HeroSlideDraft;
  imageFile: File | null;
}

const getApiErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || fallback
    : fallback;

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

const deleteImage = async (publicId: string) => {
  await api.delete("/upload", { data: { publicId } });
};

export function AdminHeroDashboard() {
  const locale = useLocale();
  const t = useTranslations("admin.hero");
  const queryClient = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<HeroSlide | null>(null);
  const [draft, setDraft] = useState<HeroSlideDraft>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [isLoadingSlide, setIsLoadingSlide] = useState(false);

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

  const slidesQuery = useQuery({
    queryKey: HERO_SLIDES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<ApiResponse<HeroSlide[]>>(
        "/admin/hero-slides"
      );
      return response.data.data;
    },
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      slide,
      draft: values,
      imageFile: file,
    }: SaveHeroSlideVariables) => {
      let uploaded: UploadedImage | null = null;
      if (file) uploaded = await uploadImage(file);
      if (!slide && !uploaded) throw new Error(t("requiredFields"));

      const payload = {
        titleAr: values.titleAr.trim(),
        titleEn: values.titleEn.trim(),
        subtitleAr: values.subtitleAr.trim(),
        subtitleEn: values.subtitleEn.trim(),
        ctaAr: values.ctaAr.trim(),
        ctaEn: values.ctaEn.trim(),
        image: uploaded?.url ?? slide?.image ?? "",
        href: values.href.trim(),
        order: Number(values.order),
        isActive: values.isActive,
      };

      try {
        if (slide) {
          await api.patch(
            `/admin/hero-slides/${encodeURIComponent(slide.id)}`,
            payload
          );
        } else {
          await api.post("/admin/hero-slides", payload);
        }
      } catch (error) {
        if (uploaded) {
          try {
            await deleteImage(uploaded.publicId);
          } catch {
            toast.error(t("uploadCleanupError"));
          }
        }
        throw error;
      }

      let imageCleanupFailed = false;
      if (slide && uploaded) {
        const oldPublicId = getCloudinaryPublicId(slide.image);
        if (oldPublicId) {
          try {
            await deleteImage(oldPublicId);
          } catch {
            imageCleanupFailed = true;
          }
        }
      }
      return { isCreate: !slide, imageCleanupFailed };
    },
    onSuccess: ({ isCreate, imageCleanupFailed }) => {
      void queryClient.invalidateQueries({ queryKey: HERO_SLIDES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      closeEditor();
      toast.success(t(isCreate ? "createSuccess" : "updateSuccess"));
      if (imageCleanupFailed) toast.warning(t("imageCleanupError"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("saveError"))),
  });

  const deleteMutation = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      await api.delete(`/admin/hero-slides/${encodeURIComponent(slide.id)}`);
      const publicId = getCloudinaryPublicId(slide.image);
      if (!publicId) return false;
      try {
        await deleteImage(publicId);
        return false;
      } catch {
        return true;
      }
    },
    onSuccess: (imageCleanupFailed) => {
      void queryClient.invalidateQueries({ queryKey: HERO_SLIDES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      setDeletingSlide(null);
      toast.success(t("deleteSuccess"));
      if (imageCleanupFailed) toast.warning(t("imageCleanupError"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("deleteError"))),
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      const response = await api.patch<ApiResponse<HeroSlide[]>>(
        "/admin/hero-slides/reorder",
        { items }
      );
      return response.data.data;
    },
    onSuccess: (slides) => {
      queryClient.setQueryData(HERO_SLIDES_QUERY_KEY, slides);
      void queryClient.invalidateQueries({ queryKey: ["hero-slides"] });
      toast.success(t("reorderSuccess"));
    },
    onError: (error) => {
      void slidesQuery.refetch();
      toast.error(getApiErrorMessage(error, t("reorderError")));
    },
  });

  const slides = slidesQuery.data ?? [];
  const titleFor = (slide: HeroSlide) =>
    locale === "ar" ? slide.titleAr : slide.titleEn || slide.titleAr;

  const resetEditorState = () => {
    setEditingSlide(null);
    setImageFile(null);
    setImagePreview("");
    setFormError("");
  };

  const closeEditor = () => {
    setEditorOpen(false);
    resetEditorState();
  };

  const openCreate = () => {
    resetEditorState();
    setDraft(emptyDraft());
    setEditorOpen(true);
  };

  const openEdit = async (slide: HeroSlide) => {
    setIsLoadingSlide(true);
    try {
      const response = await api.get<ApiResponse<HeroSlide>>(
        `/admin/hero-slides/${encodeURIComponent(slide.id)}`
      );
      const fullSlide = response.data.data;
      setEditingSlide(fullSlide);
      setDraft({
        titleAr: fullSlide.titleAr,
        titleEn: fullSlide.titleEn,
        subtitleAr: fullSlide.subtitleAr,
        subtitleEn: fullSlide.subtitleEn,
        ctaAr: fullSlide.ctaAr,
        ctaEn: fullSlide.ctaEn,
        href: fullSlide.href,
        order: String(fullSlide.order),
        isActive: fullSlide.isActive,
      });
      setImageFile(null);
      setImagePreview("");
      setFormError("");
      setEditorOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("loadError")));
    } finally {
      setIsLoadingSlide(false);
    }
  };

  const updateDraft = <K extends keyof HeroSlideDraft>(
    key: K,
    value: HeroSlideDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFormError("");
  };

  const handleImageChange = (file: File | undefined) => {
    // `undefined` = explicit removal
    if (!file) {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      setImageFile(null);
      setImagePreview("");
      setFormError("");
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFormError(t("invalidImageType"));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFormError(t("fileTooLarge"));
      return;
    }
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError("");
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !draft.titleAr.trim() ||
      !draft.titleEn.trim() ||
      !draft.subtitleAr.trim() ||
      !draft.subtitleEn.trim() ||
      !draft.ctaAr.trim() ||
      !draft.ctaEn.trim() ||
      !draft.href.trim() ||
      (!editingSlide && !imageFile)
    ) {
      setFormError(t("requiredFields"));
      return;
    }
    const order = Number(draft.order);
    if (!draft.order.trim() || !Number.isInteger(order) || order < 0) {
      setFormError(t("orderInvalid"));
      return;
    }
    saveMutation.mutate({ slide: editingSlide, draft, imageFile });
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    reorderMutation.mutate(reordered.map(({ id }, order) => ({ id, order })));
  };

  if (authQuery.isLoading) {
    return (
      <main
        className="mx-auto max-w-7xl space-y-6 px-4 py-10"
        aria-busy="true"
      >
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </main>
    );
  }

  if (authQuery.isError || !authQuery.data || !isAdmin) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-16">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("accessRequired")}</AlertTitle>
          <AlertDescription>{t("accessDescription")}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10"
      dir="rtl"
    >
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <SharedActionButton
          type="button"
          icon={<Plus />}
          disabled={isLoadingSlide}
          onClick={openCreate}
        >
          {t("create")}
        </SharedActionButton>
      </header>

      <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-none">
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                {t("tableTitle")}
              </CardTitle>
              <CardDescription className="mt-1">
                {t("tableDescription")}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {slides.length}
            </Badge>
          </div>
        </div>
        {slidesQuery.isError ? (
          <div className="p-4 sm:p-6">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{t("loadError")}</AlertTitle>
              <AlertDescription className="mt-2 flex items-center justify-between gap-4">
                {t("loadErrorDescription")}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void slidesQuery.refetch()}
                >
                  {t("retry")}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <HeroSlidesTable
            slides={slides}
            locale={locale}
            isLoading={slidesQuery.isLoading}
            isFetching={slidesQuery.isFetching}
            isReordering={reorderMutation.isPending}
            isLoadingSlide={isLoadingSlide}
            labels={{
              order: t("order"),
              image: t("image"),
              content: t("content"),
              link: t("link"),
              status: t("status"),
              actions: t("actions"),
              active: t("active"),
              inactive: t("inactive"),
              loading: t("loading"),
              empty: t("empty"),
              moveUp: (vars) => t("moveUp", vars),
              moveDown: (vars) => t("moveDown", vars),
              editSlide: (vars) => t("editSlide", vars),
              deleteSlide: (vars) => t("deleteSlide", vars),
            }}
            titleFor={titleFor}
            onMove={moveSlide}
            onEdit={(slide) => void openEdit(slide)}
            onDelete={setDeletingSlide}
          />
        )}
      </Card>

      <HeroEditorDialog
        open={editorOpen}
        locale={locale}
        editingSlide={editingSlide}
        isSaving={saveMutation.isPending}
        draft={draft}
        imageFile={imageFile}
        imagePreview={imagePreview}
        formError={formError}
        labels={{
          createTitle: t("createTitle"),
          editTitle: t("editTitle"),
          formDescription: t("formDescription"),
          sectionContent: t("sectionContent"),
          sectionMedia: t("sectionMedia"),
          sectionSettings: t("sectionSettings"),
          titleAr: t("titleAr"),
          titleEn: t("titleEn"),
          subtitleAr: t("subtitleAr"),
          subtitleEn: t("subtitleEn"),
          ctaAr: t("ctaAr"),
          ctaEn: t("ctaEn"),
          href: t("href"),
          hrefPlaceholder: "/products/category/example",
          order: t("order"),
          isActive: t("isActive"),
          image: t("image"),
          chooseImage: t("chooseImage"),
          cancel: t("cancel"),
          save: t("save"),
          saving: t("saving"),
          invalidImageType: t("invalidImageType"),
          fileTooLarge: t("fileTooLarge"),
        }}
        onOpenChange={(open) => (open ? setEditorOpen(true) : closeEditor())}
        onDraftChange={updateDraft}
        onImageChange={handleImageChange}
        onSubmit={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingSlide)}
        isDeleting={deleteMutation.isPending}
        title={t("confirmDeleteTitle")}
        description={
          deletingSlide
            ? t("confirmDeleteDescription", { name: titleFor(deletingSlide) })
            : ""
        }
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        deletingLabel={t("deleting")}
        itemName={deletingSlide ? titleFor(deletingSlide) : undefined}
        itemImage={deletingSlide?.image}
        dir="rtl"
        onOpenChange={(open) => !open && setDeletingSlide(null)}
        onConfirm={() =>
          deletingSlide && deleteMutation.mutate(deletingSlide)
        }
      />
    </main>
  );
}

// Keep constants co-located with the mutation helpers
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;