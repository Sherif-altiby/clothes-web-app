"use client";

import Image from "next/image";
import { Dialog } from "radix-ui";
import {
  AlertCircle,
  ImagePlus,
  Layers,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DescriptionInput,
  TitleInput,
} from "@/components/shared/AdminFormInputs";
import { AdminFieldInput } from "@/components/shared/AdminFieldInput";
import { Field } from "./Field";
import { LanguagePanel } from "./LanguagePanel";
 

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const TITLE_MAX = 100;
const SUBTITLE_MAX = 500;
const CTA_MAX = 50;

export interface HeroSlide {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  ctaAr: string;
  ctaEn: string;
  image: string;
  href: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideDraft {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  order: string;
  isActive: boolean;
}

export const emptyDraft = (): HeroSlideDraft => ({
  titleAr: "",
  titleEn: "",
  subtitleAr: "",
  subtitleEn: "",
  ctaAr: "",
  ctaEn: "",
  href: "",
  order: "0",
  isActive: true,
});

interface HeroEditorDialogProps {
  open: boolean;
  locale: "ar" | "en" | string;
  editingSlide: HeroSlide | null;
  isSaving: boolean;
  draft: HeroSlideDraft;
  imageFile: File | null;
  imagePreview: string;
  formError: string;
  labels: {
    createTitle: string;
    editTitle: string;
    formDescription: string;
    sectionContent: string;
    sectionMedia: string;
    sectionSettings: string;
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    ctaAr: string;
    ctaEn: string;
    href: string;
    hrefPlaceholder: string;
    order: string;
    isActive: string;
    image: string;
    chooseImage: string;
    cancel: string;
    save: string;
    saving: string;
    invalidImageType: string;
    fileTooLarge: string;
  };
  onOpenChange: (open: boolean) => void;
  onDraftChange: <K extends keyof HeroSlideDraft>(
    key: K,
    value: HeroSlideDraft[K]
  ) => void;
  onImageChange: (file: File | undefined) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function HeroEditorDialog({
  open,
  locale,
  editingSlide,
  isSaving,
  draft,
  imageFile,
  imagePreview,
  formError,
  labels,
  onOpenChange,
  onDraftChange,
  onImageChange,
  onSubmit,
}: HeroEditorDialogProps) {
  const formId = useId();
  const fileInputId = `${formId}-image`;
  const [isDragging, setIsDragging] = useState(false);

  // Revoke the preview URL when replaced / unmounted (only blob URLs)
  useEffect(() => {
    if (!imagePreview.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const preview = imagePreview || editingSlide?.image || "";
  const isCreate = !editingSlide;

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    onImageChange(file);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving) return;
        onOpenChange(nextOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <Dialog.Content
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] max-h-[820px] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="relative flex h-full flex-col">
            {/* --- Premium Header --- */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-background/60 px-6 py-5 backdrop-blur-xl">
              <div className="flex flex-col gap-1 text-right">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {isCreate ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <Layers className="h-5 w-5" />
                    )}
                  </div>
                  <Dialog.Title className="text-xl font-bold tracking-tight">
                    {editingSlide ? labels.editTitle : labels.createTitle}
                  </Dialog.Title>
                </div>
                <Dialog.Description className="mr-11 text-sm text-muted-foreground">
                  {labels.formDescription}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{labels.cancel}</span>
                </Button>
              </Dialog.Close>
            </div>

            {/* --- Body --- */}
            <form
              onSubmit={onSubmit}
              noValidate
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-border">
                <div className="space-y-8 pb-6">
                  {/* Section 1: Content (bilingual) */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.sectionContent}
                      </h3>
                      <Separator className="flex-1" />
                    </div>

                    <LanguagePanel code="EN" dir="ltr">
                      <Field label={labels.titleEn} required>
                        {(id) => (
                          <TitleInput
                            id={id}
                            dir="ltr"
                            maxLength={TITLE_MAX}
                            value={draft.titleEn}
                            invalid={Boolean(formError && !draft.titleEn.trim())}
                            onChange={(v) => onDraftChange("titleEn", v)}
                          />
                        )}
                      </Field>
                      <Field label={labels.subtitleEn} required>
                        {(id) => (
                          <DescriptionInput
                            id={id}
                            dir="ltr"
                            maxLength={SUBTITLE_MAX}
                            value={draft.subtitleEn}
                            invalid={Boolean(
                              formError && !draft.subtitleEn.trim()
                            )}
                            onChange={(v) => onDraftChange("subtitleEn", v)}
                          />
                        )}
                      </Field>
                      <Field label={labels.ctaEn} required>
                        {(id) => (
                          <TitleInput
                            id={id}
                            dir="ltr"
                            maxLength={CTA_MAX}
                            value={draft.ctaEn}
                            invalid={Boolean(formError && !draft.ctaEn.trim())}
                            onChange={(v) => onDraftChange("ctaEn", v)}
                          />
                        )}
                      </Field>
                    </LanguagePanel>

                    <LanguagePanel code="AR" dir="rtl">
                      <Field label={labels.titleAr} required>
                        {(id) => (
                          <TitleInput
                            id={id}
                            dir="rtl"
                            maxLength={TITLE_MAX}
                            value={draft.titleAr}
                            invalid={Boolean(formError && !draft.titleAr.trim())}
                            onChange={(v) => onDraftChange("titleAr", v)}
                          />
                        )}
                      </Field>
                      <Field label={labels.subtitleAr} required>
                        {(id) => (
                          <DescriptionInput
                            id={id}
                            dir="rtl"
                            maxLength={SUBTITLE_MAX}
                            value={draft.subtitleAr}
                            invalid={Boolean(
                              formError && !draft.subtitleAr.trim()
                            )}
                            onChange={(v) => onDraftChange("subtitleAr", v)}
                          />
                        )}
                      </Field>
                      <Field label={labels.ctaAr} required>
                        {(id) => (
                          <TitleInput
                            id={id}
                            dir="rtl"
                            maxLength={CTA_MAX}
                            value={draft.ctaAr}
                            invalid={Boolean(formError && !draft.ctaAr.trim())}
                            onChange={(v) => onDraftChange("ctaAr", v)}
                          />
                        )}
                      </Field>
                    </LanguagePanel>
                  </section>

                  {/* Section 2: Media */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.sectionMedia}
                      </h3>
                      <Separator className="flex-1" />
                      <Badge
                        variant={preview ? "secondary" : "outline"}
                        className="ms-4"
                      >
                        {preview ? "1 / 1" : "0 / 1"}
                      </Badge>
                    </div>

                    <input
                      id={fileInputId}
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES.join(",")}
                      className="hidden"
                      onChange={(event) => {
                        pickFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />

                    {preview ? (
                      <div className="group relative aspect-[21/9] overflow-hidden rounded-xl border border-primary bg-muted shadow-md ring-2 ring-primary/20">
                        <Image
                          src={preview}
                          alt=""
                          fill
                          unoptimized={Boolean(imageFile)}
                          sizes="640px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          disabled={isSaving}
                          onClick={() => onImageChange(undefined)}
                          className="absolute left-1.5 top-1.5 h-8 w-8 rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110"
                          aria-label={labels.chooseImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <label
                          htmlFor={fileInputId}
                          className="absolute inset-0 cursor-pointer"
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <label
                        htmlFor={fileInputId}
                        onDragOver={(event) => {
                          event.preventDefault();
                          if (!isSaving) setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setIsDragging(false);
                          if (!isSaving)
                            pickFile(event.dataTransfer.files?.[0]);
                        }}
                        className={cn(
                          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
                          isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
                          isSaving && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm transition-colors duration-200",
                            isDragging
                              ? "text-primary ring-4 ring-primary/20"
                              : "text-muted-foreground"
                          )}
                        >
                          <ImagePlus className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {labels.chooseImage}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG · PNG · WEBP · 5MB
                          </p>
                        </div>
                      </label>
                    )}
                  </section>

                  {/* Section 3: Settings */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.sectionSettings}
                      </h3>
                      <Separator className="flex-1" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={labels.href} required>
                        {(id) => (
                          <AdminFieldInput
                            id={id}
                            dir="ltr"
                            type="text"
                            value={draft.href}
                            placeholder={labels.hrefPlaceholder}
                            invalid={Boolean(formError && !draft.href.trim())}
                            onChange={(event) =>
                              onDraftChange("href", event.target.value)
                            }
                          />
                        )}
                      </Field>
                      <Field label={labels.order} required>
                        {(id) => (
                          <AdminFieldInput
                            id={id}
                            dir="ltr"
                            type="number"
                            min="0"
                            step="1"
                            value={draft.order}
                            invalid={Boolean(
                              formError &&
                                (!draft.order.trim() ||
                                  !Number.isInteger(Number(draft.order)) ||
                                  Number(draft.order) < 0)
                            )}
                            onChange={(event) =>
                              onDraftChange("order", event.target.value)
                            }
                          />
                        )}
                      </Field>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                      <input
                        id={`${formId}-active`}
                        type="checkbox"
                        checked={draft.isActive}
                        className="h-4 w-4 accent-primary"
                        onChange={(event) =>
                          onDraftChange("isActive", event.target.checked)
                        }
                      />
                      <Label
                        htmlFor={`${formId}-active`}
                        className="text-sm font-semibold"
                      >
                        {labels.isActive}
                      </Label>
                    </label>
                  </section>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-background/80 p-4 px-6 backdrop-blur-xl">
                <div className="min-w-0 flex-1 text-start">
                  {formError && (
                    <div
                      role="alert"
                      className="flex items-center gap-1.5 text-sm text-destructive animate-in slide-in-from-right-2"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{formError}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={isSaving}
                    className="rounded-xl text-base"
                  >
                    {labels.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[120px] rounded-xl text-base bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                  >
                    {isSaving && (
                      <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
                    )}
                    {isSaving ? labels.saving : labels.save}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}