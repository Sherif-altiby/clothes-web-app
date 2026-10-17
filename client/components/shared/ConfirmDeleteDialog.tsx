"use client";

import Image from "next/image";
import { AlertDialog } from "radix-ui";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  isDeleting: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  deletingLabel: string;
  itemName?: string;
  itemImage?: string;
  dir?: "ltr" | "rtl";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  isDeleting,
  title,
  description,
  cancelLabel,
  confirmLabel,
  deletingLabel,
  itemName,
  itemImage,
  dir = "rtl",
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(nextOpen) => !isDeleting && onOpenChange(nextOpen)}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          dir={dir}
          className="fixed left-1/2 top-1/2 z-[60] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            >
              <TriangleAlert className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <AlertDialog.Title className="text-lg font-bold leading-tight">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          {itemName && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                {itemImage && (
                  <Image
                    src={itemImage}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                {itemName}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              {isDeleting ? deletingLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
