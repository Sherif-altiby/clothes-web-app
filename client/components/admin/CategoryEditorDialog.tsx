"use client";

import Image from "next/image";
import { Dialog } from "radix-ui";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const preview = previewUrl || category?.image || "";

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!titleAr.trim() || !titleEn.trim() || (!category && !imageFile)) {
      setError(labels.requiredFields);
      return;
    }
    if (imageFile && !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
      setError(labels.invalidImageType);
      return;
    }
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setError(labels.fileTooLarge);
      return;
    }

    setError("");
    try {
      await onSave({ titleAr: titleAr.trim(), titleEn: titleEn.trim() }, imageFile);
    } catch {
      setError(labels.saveError);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-2xl outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold">
                {category ? labels.editTitle : labels.createTitle}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {labels.description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={labels.cancel} disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form className="mt-6 space-y-5" onSubmit={submit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-title-ar">{labels.titleAr}</Label>
                <Input
                  id="category-title-ar"
                  value={titleAr}
                  onChange={(event) => setTitleAr(event.target.value)}
                  maxLength={100}
                  required
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-title-en">{labels.titleEn}</Label>
                <Input
                  id="category-title-en"
                  value={titleEn}
                  onChange={(event) => setTitleEn(event.target.value)}
                  maxLength={100}
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-image">{labels.image}</Label>
              <label
                htmlFor="category-image"
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center transition hover:bg-muted/60"
              >
                {preview ? (
                  <span className="relative h-32 w-full overflow-hidden rounded-lg">
                    <Image src={preview} alt="" fill unoptimized className="object-cover" />
                  </span>
                ) : (
                  <ImagePlus className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="text-sm font-medium">{labels.chooseImage}</span>
                <input
                  id="category-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                    setPreviewUrl(file ? URL.createObjectURL(file) : "");
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
                {labels.cancel}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isSaving ? labels.saving : category ? labels.save : labels.create}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
