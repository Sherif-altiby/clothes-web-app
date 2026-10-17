"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  previousLabel: string;
  nextLabel: string;
  navigationLabel: string;
  pageLabel: (page: number, totalPages: number) => string;
}

type PageItem = number | "start-ellipsis" | "end-ellipsis";

function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: PageItem[] = [];
  pages.forEach((value, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && value - previous > 1) {
      items.push(previous === 1 ? "start-ellipsis" : "end-ellipsis");
    }
    items.push(value);
  });
  return items;
}

export function DataPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  previousLabel,
  nextLabel,
  navigationLabel,
  pageLabel,
}: DataPaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="flex items-center justify-between gap-3" aria-label={navigationLabel}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || page <= 1}
        aria-label={previousLabel}
        onClick={() => onPageChange(page - 1)}
      >
        {/* Chevrons flip automatically in RTL layouts */}
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </Button>

      <p className="text-sm text-muted-foreground sm:hidden" aria-live="polite">
        {pageLabel(page, totalPages)}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {items.map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="px-1 text-sm text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                type="button"
                size="icon-sm"
                variant={item === page ? "default" : "ghost"}
                className="tabular-nums"
                disabled={disabled}
                aria-label={pageLabel(item, totalPages)}
                aria-current={item === page ? "page" : undefined}
                onClick={() => item !== page && onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          )
        )}
      </ul>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || page >= totalPages}
        aria-label={nextLabel}
        onClick={() => onPageChange(page + 1)}
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Button>
    </nav>
  );
}