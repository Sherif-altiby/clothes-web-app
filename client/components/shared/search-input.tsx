// components/ui/search-input.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Use React's native input props for proper typings
export interface SearchInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      clearLabel = "Clear search",
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = value.length > 0;

    const handleClear = () => {
      onChange("");
      if (onClear) onClear();
    };

    return (
      <div className={cn("group relative w-full", containerClassName)}>
        {/* Search Icon */}
        <Search
          className={cn(
            "pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2",
            "text-muted-foreground/60 transition-colors duration-200",
            "group-focus-within:text-foreground"
          )}
          aria-hidden="true"
        />

        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            // Base styles matching the Select component
            "relative z-10 h-12 rounded-[11px] border border-border/80 bg-background/60 shadow-sm",
            "px-10", // Default padding (start-3.5 icon + spacing)
            hasValue && "pe-10", // Extra padding at the end when clear button is visible
            "transition-all duration-300 ease-out",
            
            // Hover & Focus States (matching Select)
            "hover:border-border hover:shadow-md hover:bg-accent/5",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:outline-none focus-visible:bg-background",
            
            // Disabled state
            disabled && "opacity-50 cursor-not-allowed",
            
            className
          )}
          {...props}
        />

        {/* Animated Shimmer Sweep on Hover (using a pseudo-wrapper technique) */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[11px]",
            "before:absolute before:inset-0 before:-translate-x-full",
            "before:bg-[linear-gradient(90deg,transparent,hsl(var(--foreground)/0.04),transparent)]",
            "before:transition-transform before:duration-1000 before:ease-in-out",
            "group-hover:before:translate-x-full group-focus-within:before:hidden",
            disabled && "hidden"
          )}
        />

        {/* Clear Button */}
        {hasValue && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={clearLabel}
            className={cn(
              "absolute end-2 top-1/2 z-20 h-7 w-7 -translate-y-1/2 rounded-full",
              "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              "transition-all duration-200 animate-in fade-in zoom-in-75"
            )}
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";