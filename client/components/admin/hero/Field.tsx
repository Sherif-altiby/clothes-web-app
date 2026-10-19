"use client";

import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

export function Field({
  label,
  description,
  error,
  required,
  counter,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  counter?: { current: number; max: number };
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const showCounter = counter && counter.current >= counter.max * 0.8;
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
        {showCounter && counter && (
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              counter.current > counter.max
                ? "text-destructive"
                : "text-muted-foreground"
            )}
            dir="ltr"
          >
            {counter.current}/{counter.max}
          </span>
        )}
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