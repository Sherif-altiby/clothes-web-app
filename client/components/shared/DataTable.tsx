import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  skeleton?: ReactNode;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  emptyMessage: string;
  loadingMessage: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  skeletonRows?: number;
  emptyIcon?: ReactNode;
  className?: string;
}

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyMessage,
  loadingMessage,
  isLoading = false,
  isRefreshing = false,
  skeletonRows = 6,
  emptyIcon,
  className,
}: DataTableProps<Row>) {
  const isBusy = isLoading || isRefreshing;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-border/70 bg-card",
        "shadow-sm shadow-black/[0.025]",
        className
      )}
    >
      {isBusy && (
        <span role="status" className="sr-only">
          {loadingMessage}
        </span>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow
              className={cn(
                "border-b border-border/70 bg-muted/40",
                "hover:bg-muted/40"
              )}
            >
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-12 whitespace-nowrap px-5",
                    "text-right text-xs font-semibold tracking-wide",
                    "text-muted-foreground",
                    "first:ps-6 last:pe-6",
                    column.className
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody
            aria-busy={isBusy}
            className={cn(
              "transition-opacity duration-200",
              isRefreshing && !isLoading && "opacity-60"
            )}
          >
            {isLoading ? (
              Array.from({ length: skeletonRows }, (_, rowIndex) => (
                <TableRow
                  key={`skeleton-${rowIndex}`}
                  className="hover:bg-transparent"
                >
                  {columns.map((column, columnIndex) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "px-5 py-4 first:ps-6 last:pe-6",
                        column.className
                      )}
                    >
                      {column.skeleton ?? (
                        <div className="flex items-center gap-3">
                          {columnIndex === 0 && (
                            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                          )}
                          <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-3/4 max-w-36 rounded-md" />
                            <Skeleton className="h-3 w-1/2 max-w-24 rounded-md" />
                          </div>
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  className={cn(
                    "group/row border-b border-border/50",
                    "transition-colors duration-150",
                    "hover:bg-muted/35",
                    "last:border-b-0"
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        "px-5 py-4 align-middle",
                        "first:ps-6 last:pe-6",
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-64 p-6">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-4 text-center">
                    <div
                      className={cn(
                        "flex h-16 w-16 items-center justify-center",
                        "rounded-2xl border border-border/60",
                        "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {emptyIcon ?? (
                        <Inbox
                          className="h-7 w-7"
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-foreground">
                        No results found
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {emptyMessage}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isRefreshing && !isLoading && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/10"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
