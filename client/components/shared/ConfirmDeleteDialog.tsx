"use client";

import Image from "next/image";
import { AlertDialog } from "radix-ui";
import { LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />

        {/*
          Mobile: bottom sheet (thumb-reachable actions).
          ≥ sm: centered dialog.
          All spacing/alignment uses logical properties, so the `dir` prop
          flips the layout correctly with no hard-coded left/right.
        */}
        <AlertDialog.Content
          dir={dir}
          className={cn(
            "fixed z-[60] bg-background text-start shadow-2xl outline-none",
            "inset-x-0 bottom-0 rounded-t-3xl border-t border-border px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[26rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:p-6",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-8 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95",
            "motion-reduce:animate-none"
          )}
        >
          {/* Sheet grabber, mobile only */}
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden"
          />

          {/* Icon */}
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5"
          >
            <Trash2 className="h-5 w-5" />
          </span>

          {/* Copy */}
          <div className="mt-5 space-y-2">
            <AlertDialog.Title className="text-xl font-bold leading-snug tracking-tight text-foreground">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>

          {/* Item being deleted: dashed outline + muted image = "on its way out" */}
          {itemName && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-destructive/40 bg-destructive/[0.03] p-2.5">
              {itemImage && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={itemImage}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover grayscale"
                  />
                </div>
              )}
              <p className="min-w-0 flex-1 truncate ps-1 text-sm font-semibold text-foreground">
                {itemName}
              </p>
            </div>
          )}

          {/* Actions: equal-width, cancel is first in reading order */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isDeleting}
              >
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>

            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="gap-2"
              disabled={isDeleting}
              aria-busy={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting && (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isDeleting ? deletingLabel : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}