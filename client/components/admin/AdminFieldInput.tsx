
"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminFieldInputProps
  extends Omit<ComponentProps<typeof Input>, "prefix"> {
  /** Content displayed at the inline-start edge. */
  prefix?: ReactNode;
  /** Content displayed at the inline-end edge. */
  suffix?: ReactNode;
  /** Marks the input invalid. Implied when error is provided. */
  invalid?: boolean;
  /** Validation message displayed below the input. */
  error?: string;
  /** Helper text displayed when there is no error. */
  hint?: string;
}

const adornment =
  "pointer-events-none absolute top-1/2 z-10 flex -translate-y-1/2 " +
  "items-center justify-center text-muted-foreground " +
  "transition-colors duration-200 group-focus-within:text-primary " +
  "group-has-[:disabled]:opacity-50 " +
  "[&>svg]:size-4 [&>svg]:shrink-0";

export function AdminFieldInput({
  id,
  prefix,
  suffix,
  invalid,
  error,
  hint,
  type,
  className,
  "aria-describedby": describedBy,
  ...props
}: AdminFieldInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  const isInvalid = Boolean(invalid || error);
  const message = error || hint;

  const describedByIds = [message ? messageId : undefined, describedBy]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="group relative">
        {prefix && (
          <span
            aria-hidden="true"
            className={cn(adornment, "start-3.5")}
          >
            {prefix}
          </span>
        )}

        <Input
          {...props}
          id={inputId}
          type={type}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedByIds || undefined}
          className={cn(
            "h-11 w-full rounded-xl border-border/70 bg-background",
            "px-3.5 text-sm shadow-sm shadow-black/[0.02]",
            "placeholder:text-muted-foreground/65",
            "transition-[border-color,box-shadow,background-color] duration-200",
            "hover:border-border",
            "focus-visible:border-primary/60",
            "focus-visible:ring-4 focus-visible:ring-primary/10",
            "focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-muted/50",
            "disabled:text-muted-foreground disabled:opacity-70",
            "aria-[invalid=true]:border-destructive/70",
            "aria-[invalid=true]:focus-visible:border-destructive",
            "aria-[invalid=true]:focus-visible:ring-destructive/10",
            prefix && "ps-10",
            suffix && "pe-10",
            type === "number" &&
              "tabular-nums [appearance:textfield] " +
                "[&::-webkit-inner-spin-button]:appearance-none " +
                "[&::-webkit-outer-spin-button]:appearance-none",
            className
          )}
        />

        {suffix && (
          <span
            aria-hidden="true"
            className={cn(adornment, "end-3.5")}
          >
            {suffix}
          </span>
        )}
      </div>

      {message && (
        <div
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn(
            "flex items-start gap-1.5 px-0.5",
            "text-xs leading-5",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error ? (
            <CircleAlert
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-3.5 shrink-0 opacity-60"
              aria-hidden="true"
            />
          )}

          <p className="min-w-0 break-words">{message}</p>
        </div>
      )}
    </div>
  );
}
