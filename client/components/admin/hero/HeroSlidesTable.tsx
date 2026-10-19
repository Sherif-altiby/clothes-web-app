"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import type { HeroSlide } from "./HeroEditorDialog";

interface HeroSlidesTableProps {
  slides: HeroSlide[];
  locale: string;
  isLoading: boolean;
  isFetching: boolean;
  isReordering: boolean;
  isLoadingSlide: boolean;
  labels: {
    order: string;
    image: string;
    content: string;
    link: string;
    status: string;
    actions: string;
    active: string;
    inactive: string;
    loading: string;
    empty: string;
    moveUp: (vars: { name: string }) => string;
    moveDown: (vars: { name: string }) => string;
    editSlide: (vars: { name: string }) => string;
    deleteSlide: (vars: { name: string }) => string;
  };
  titleFor: (slide: HeroSlide) => string;
  onMove: (index: number, direction: -1 | 1) => void;
  onEdit: (slide: HeroSlide) => void;
  onDelete: (slide: HeroSlide) => void;
}

export function HeroSlidesTable({
  slides,
  locale,
  isLoading,
  isFetching,
  isReordering,
  isLoadingSlide,
  labels,
  titleFor,
  onMove,
  onEdit,
  onDelete,
}: HeroSlidesTableProps) {
  const columns: DataTableColumn<HeroSlide>[] = [
    {
      key: "order",
      header: labels.order,
      className: "w-28 whitespace-nowrap",
      skeleton: <Skeleton className="h-8 w-16" />,
      cell: (slide) => {
        const index = slides.findIndex((item) => item.id === slide.id);
        return (
          <div className="flex items-center gap-1">
            <span className="min-w-6 text-center font-semibold tabular-nums">
              {slide.order + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.moveUp({ name: titleFor(slide) })}
              disabled={isReordering || index === 0}
              onClick={() => onMove(index, -1)}
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.moveDown({ name: titleFor(slide) })}
              disabled={isReordering || index === slides.length - 1}
              onClick={() => onMove(index, 1)}
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
    {
      key: "image",
      header: labels.image,
      className: "w-24",
      skeleton: <Skeleton className="h-12 w-20 rounded-lg" />,
      cell: (slide) => (
        <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
          <Image
            src={slide.image}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ),
    },
    {
      key: "content",
      header: labels.content,
      className: "min-w-56",
      skeleton: <Skeleton className="h-10 w-48" />,
      cell: (slide) => (
        <div className="space-y-1">
          <p className="font-semibold">{titleFor(slide)}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {locale === "ar" ? slide.subtitleAr : slide.subtitleEn}
          </p>
        </div>
      ),
    },
    {
      key: "link",
      header: labels.link,
      className: "min-w-40 max-w-64",
      skeleton: <Skeleton className="h-4 w-32" />,
      cell: (slide) => (
        <span
          dir="ltr"
          className="block truncate text-sm text-muted-foreground"
        >
          {slide.href}
        </span>
      ),
    },
    {
      key: "status",
      header: labels.status,
      className: "whitespace-nowrap",
      skeleton: <Skeleton className="h-6 w-20 rounded-full" />,
      cell: (slide) => (
        <Badge variant={slide.isActive ? "default" : "secondary"}>
          {slide.isActive ? labels.active : labels.inactive}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: labels.actions,
      className: "w-24",
      skeleton: <Skeleton className="h-8 w-16" />,
      cell: (slide) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.editSlide({ name: titleFor(slide) })}
            disabled={isLoadingSlide}
            onClick={() => onEdit(slide)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label={labels.deleteSlide({ name: titleFor(slide) })}
            onClick={() => onDelete(slide)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      className="rounded-none border-0 shadow-none"
      columns={columns}
      rows={slides}
      getRowKey={(slide) => slide.id}
      isLoading={isLoading}
      isRefreshing={isFetching && !isLoading}
      loadingMessage={labels.loading}
      emptyMessage={labels.empty}
      skeletonRows={5}
    />
  );
}