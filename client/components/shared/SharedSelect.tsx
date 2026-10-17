"use client";

import { forwardRef } from "react";
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
  /** Renders a "clear" option that resets the value. */
  allowClear?: boolean;
  clearLabel?: string;
}

const sizeClasses = {
  sm: "h-8 text-sm",
  default: "h-10",
  lg: "h-12 text-base",
} as const;

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

    return (
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isEmpty}
      >
        <SelectTrigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(sizeClasses[size], className)}
        >
          <SelectValue
            placeholder={isEmpty ? "No options available" : placeholder}
          />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
          {allowClear && value !== "" && (
            <>
              <div className="my-1 h-px bg-border" role="separator" />
              <SelectItem
                value="__clear__"
                className="text-muted-foreground"
                onSelect={() => onValueChange("")}
              >
                {clearLabel}
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    );
  },
);