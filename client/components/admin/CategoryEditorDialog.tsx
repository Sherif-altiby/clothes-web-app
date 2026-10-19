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
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TitleInput } from "@/components/shared/AdminFormInputs";

export interface CategoryFormData {
  titleAr: string;
  titleEn: string;
}

export interface EditableCategory {
  id: string;
  title: string;
  titleAr: string;
  titleEn: string;
  image: string;
  createdAt: string;
  _count?: { products: number };
}

const TITLE_MAX = 100;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface CategoryEditorDialogProps {
  open: boolean;
  category: EditableCategory | null;
  isSaving: boolean;
  labels: {
    createTitle: string;
    editTitle: string;
    description: string;
    titleAr: string;
    titleEn: string;
    image: string;
    chooseImage: string;
    cancel: string;
    create: string;
    save: string;
    saving: string;
    requiredFields: string;
    saveError: string;
    invalidImageType: string;
    fileTooLarge: string;
  };
  onOpenChange: (open: boolean) => void;
  onSave: (data: CategoryFormData, imageFile: File | null) => Promise<void>;
}

export function CategoryEditorDialog({
  open,
  category,
  isSaving,
  labels,
  onOpenChange,
  onSave,
}: CategoryEditorDialogProps) {
  const [titleAr, setTitleAr] = useState(category?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(category?.titleEn ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const preview = previewUrl || category?.image || "";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(labels.invalidImageType);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(labels.fileTooLarge);
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!titleAr.trim() || !titleEn.trim() || (!category && !imageFile)) {
      setError(labels.requiredFields);
      return;
    }
    setError("");
    try {
      await onSave({ titleAr: titleAr.trim(), titleEn: titleEn.trim() }, imageFile);
    } catch {
      setError(labels.saveError);
    }
  };

  if (!open) return null;

  const isCreate = !category;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] max-h-[720px] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-background shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
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
                    {category ? labels.editTitle : labels.createTitle}
                  </Dialog.Title>
                </div>
                <Dialog.Description className="mr-11 text-sm text-muted-foreground">
                  {labels.description}
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
                  disabled={isSaving}
                  aria-label={labels.cancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {/* --- Body --- */}
            <form
              onSubmit={submit}
              noValidate
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6 scrollbar-thin scrollbar-thumb-border">
                <div className="space-y-8 pb-6">
                  {/* Section 1: Titles */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.titleAr} / {labels.titleEn}
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
                            value={titleEn}
                            invalid={error === labels.requiredFields && !titleEn.trim()}
                            onChange={(value) => {
                              setTitleEn(value);
                              setError("");
                            }}
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
                            value={titleAr}
                            invalid={error === labels.requiredFields && !titleAr.trim()}
                            onChange={(value) => {
                              setTitleAr(value);
                              setError("");
                            }}
                          />
                        )}
                      </Field>
                    </LanguagePanel>
                  </section>

                  {/* Section 2: Image */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        {labels.image}
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
                      id="category-image"
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      className="hidden"
                      onChange={(event) => {
                        handleFile(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                    />

                    {preview ? (
                      <div className="group relative aspect-[21/9] overflow-hidden rounded-xl border border-primary bg-muted shadow-md ring-2 ring-primary/20">
                        <Image
                          src={preview}
                          alt=""
                          fill
                          unoptimized
                          sizes="560px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          disabled={isSaving}
                          onClick={() => {
                            setImageFile(null);
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                            setPreviewUrl("");
                          }}
                          className="absolute left-1.5 top-1.5 h-8 w-8 rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110"
                          aria-label={labels.chooseImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <label
                          htmlFor="category-image"
                          className="absolute inset-0 cursor-pointer"
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <label
                        htmlFor="category-image"
                        onDragOver={(event) => {
                          event.preventDefault();
                          if (!isSaving) setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setIsDragging(false);
                          if (!isSaving)
                            handleFile(event.dataTransfer.files?.[0] ?? null);
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
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-background/80 p-4 px-6 backdrop-blur-xl">
                <div className="min-w-0 flex-1 text-start">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-center gap-1.5 text-sm text-destructive animate-in slide-in-from-right-2"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{error}</span>
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
                      <LoaderCircle className="h-4 w-4 animate-spin me-2" />
                    )}
                    {isSaving
                      ? labels.saving
                      : category
                        ? labels.save
                        : labels.create}
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

/* ---------- Helper Components ---------- */

function LanguagePanel({
  code,
  dir,
  children,
}: {
  code: string;
  dir: "ltr" | "rtl";
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4 transition-all duration-300 focus-within:border-border/80 focus-within:bg-background focus-within:shadow-sm">
      <Badge
        variant="outline"
        dir={dir}
        className="bg-background px-2.5 py-1 text-xs font-semibold"
      >
        {code}
      </Badge>
      {children}
    </div>
  );
}

function Field({
  label,
  description,
  error,
  required,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="group space-y-2 text-right">
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={id}
          className="text-sm font-semibold text-muted-foreground transition-colors group-focus-within:text-primary"
        >
          {label}
          {required && (
            <span className="ms-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      </div>
      {children(id)}
      {error ? (
        <p className="flex items-center justify-end gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}