"use client";

import { forwardRef, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SharedSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SharedSelectProps {
  value: string;
  options: SharedSelectOption[];
  placeholder: string;
  onValueChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  allowClear?: boolean;
  clearLabel?: string;
}

const sizeClasses = {
  sm: "pr-9 pl-4 text-sm",
  default: "pr-10 pl-4",
  lg: "pr-12 pl-5 text-base",
} as const;

const indicatorSizeClasses = {
  sm: "size-3.5 right-3",
  default: "size-4 right-3.5",
  lg: "size-5 right-4",
} as const;

const CLEAR_VALUE = "__clear__";

function ChevronGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const SharedSelect = forwardRef<HTMLButtonElement, SharedSelectProps>(
  function SharedSelect(
    {
      value,
      options,
      placeholder,
      onValueChange,
      id,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      className,
      contentClassName,
      disabled,
      size = "default",
      allowClear = false,
      clearLabel = "Clear selection",
    },
    ref,
  ) {
    const isEmpty = options.length === 0;
    const showClear = allowClear && value !== "" && !isEmpty;
    const hasValue = value !== "";

    const handleValueChange = (next: string) => {
      if (next === CLEAR_VALUE) {
        onValueChange("");
        return;
      }
      onValueChange(next);
    };

    const ariaLabelResolved = useMemo(
      () => ariaLabel ?? (isEmpty ? "No options available" : undefined),
      [ariaLabel, isEmpty],
    );

    return (
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || isEmpty}
        dir="rtl" // <-- Forces RTL behavior
      >
        <SelectTrigger
          ref={ref}
          id={id}
          aria-label={ariaLabelResolved}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            "block rounded-[11px] !h-12",
            "[&>svg]:hidden [&>span:last-child]:hidden",
            // Base Layout & Fixes
            "group relative w-full items-center justify-end overflow-hidden", // <-- justify-end for right alignment
            "border border-border/80 bg-background shadow-sm",
            "transition-all duration-300 ease-out",
            
            // Hover & Focus States
            "hover:border-border hover:shadow-md hover:bg-accent/5",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:outline-none",
            "data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/20 data-[state=open]:bg-background",
            
            // Special Pre-Open Design (Gradient Sheen)
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
            "before:bg-[linear-gradient(105deg,transparent_0%,transparent_60%,hsl(var(--foreground)/0.03)_100%)]",
            "before:opacity-100 before:transition-opacity before:duration-300",
            "data-[state=open]:before:opacity-0",
            
            sizeClasses[size],
            isEmpty && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          {/* Animated Shimmer Sweep on Hover */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 translate-x-full", // <-- Flipped for RTL
              "bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.04),transparent)]", // <-- Flipped for RTL
              "transition-transform duration-1000 ease-in-out",
              "group-hover:-translate-x-full group-data-[state=open]:hidden", // <-- Flipped for RTL
            )}
          />

          {/* Trailing Chevron (Right aligned for RTL visual flow) */}
          <ChevronGlyph
            className={cn(
              "absolute z-10 text-muted-foreground/60 transition-transform duration-300",
              "group-hover:text-foreground/80",
              "group-data-[state=open]:rotate-180 group-data-[state=open]:text-foreground",
              indicatorSizeClasses[size],
            )}
          />

          {/* Value / Placeholder */}
          <SelectValue
            placeholder={isEmpty ? "No options available" : placeholder}
            className={cn(
              "relative z-10 truncate text-right transition-colors duration-200", // <-- text-right
              hasValue ? "text-foreground font-medium" : "text-muted-foreground font-normal",
            )}
          />
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={8}
          className={cn(
            "min-w-[var(--radix-select-trigger-width)] overflow-hidden",
            "rounded-[11px] border border-border/80 bg-popover/95 backdrop-blur-xl p-1.5 shadow-xl",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            contentClassName,
          )}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(
                  "[&>span:first-child]:hidden",
                  "group/item relative my-0.5 cursor-pointer rounded-md py-2.5 px-3",
                  "text-right transition-all duration-200", // <-- text-right
                  "focus:bg-accent focus:text-accent-foreground",
                  isActive && "font-semibold text-foreground bg-accent/40",
                )}
              >
                {/* Custom Active Checkmark (Left side for RTL) */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 text-primary", // <-- Moved to left
                    "transition-all duration-200",
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-50",
                  )}
                >
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path
                      d="M3.5 8.5l3 3 6-6.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                
                <span className="pl-6">{option.label}</span> {/* <-- pl-6 for RTL */}
              </SelectItem>
            );
          })}

          {showClear && (
            <>
              <div className="mx-2 my-1 h-px bg-border/60" role="separator" />
              <SelectItem
                value={CLEAR_VALUE}
                className={cn(
                  "[&>span:first-child]:hidden",
                  "my-0.5 cursor-pointer rounded-md py-2.5 px-3",
                  "text-right text-muted-foreground transition-all duration-200",
                  "focus:bg-destructive/10 focus:text-destructive",
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2" // <-- Moved to left
                >
                  <svg viewBox="0 0 16 16" fill="none" className="size-4">
                    <path
                      d="M4.5 4.5l7 7m0-7l-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="pl-6">{clearLabel}</span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    );
  },
);