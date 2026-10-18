"use client";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AdminFieldInput } from "./AdminFieldInput";

const inputBaseClasses = cn(
  "h-14 text-base rounded-[11px] border border-border/80 bg-background/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  "transition-all duration-300 ease-out text-right",
  "hover:border-border hover:bg-background hover:shadow-md",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:outline-none focus-visible:bg-background",
  "placeholder:text-muted-foreground/60",
  "px-4 py-3"
);

const shimmerClasses = cn(
  "pointer-events-none absolute inset-0 overflow-hidden rounded-[11px]"
);

const shimmerSweepClasses = cn(
  "absolute inset-0 flex h-full w-full justify-center translate-x-full",
  "transition-transform duration-1000 ease-in-out group-focus-within:hidden group-hover:-translate-x-full"
);

interface StringInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}

interface DirectionalStringInputProps extends StringInputProps {
  dir: "ltr" | "rtl";
}

export function MoneyInput({
  id,
  min,
  value,
  onChange,
  invalid,
}: StringInputProps & { min: string }) {
  return (
    <div className="relative group">
      <AdminFieldInput
        id={id}
        required
        type="number"
        inputMode="decimal"
        min={min}
        step="0.01"
        dir="ltr"
        className={cn(inputBaseClasses, "tabular-nums", invalid && "border-destructive ring-destructive/20")}
        invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true" className={shimmerClasses}>
        <span className={shimmerSweepClasses}>
          <span className="relative h-full w-8 bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
        </span>
      </span>
    </div>
  );
}

export function PercentInput({ id, value, onChange, invalid }: StringInputProps) {
  return (
    <div className="relative group">
      <AdminFieldInput
        id={id}
        required
        type="number"
        inputMode="decimal"
        min="0"
        max="100"
        step="0.01"
        dir="ltr"
        className={cn(inputBaseClasses, "tabular-nums", invalid && "border-destructive ring-destructive/20")}
        suffix="%"
        invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true" className={shimmerClasses}>
        <span className={shimmerSweepClasses}>
          <span className="relative h-full w-8 bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
        </span>
      </span>
    </div>
  );
}

export function CountInput({ id, value, onChange, invalid }: StringInputProps) {
  return (
    <div className="relative group">
      <AdminFieldInput
        id={id}
        required
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        dir="ltr"
        className={cn(inputBaseClasses, "tabular-nums", invalid && "border-destructive ring-destructive/20")}
        invalid={invalid}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true" className={shimmerClasses}>
        <span className={shimmerSweepClasses}>
          <span className="relative h-full w-8 bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
        </span>
      </span>
    </div>
  );
}

export function TitleInput({
  id,
  dir,
  value,
  onChange,
  invalid,
  maxLength,
}: DirectionalStringInputProps & { maxLength: number }) {
  return (
    <div className="relative group">
      <AdminFieldInput
        id={id}
        required
        maxLength={maxLength}
        dir={dir}
        value={value}
        invalid={invalid}
        className={cn(inputBaseClasses, "font-medium", invalid && "border-destructive ring-destructive/20")}
        placeholder={dir === "rtl" ? "مثال: قميص قطني" : "e.g. Cotton shirt"}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true" className={shimmerClasses}>
        <span className={shimmerSweepClasses}>
          <span className="relative h-full w-8 bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
        </span>
      </span>
    </div>
  );
}

export function DescriptionInput({
  id,
  dir,
  value,
  onChange,
  invalid,
  maxLength,
}: DirectionalStringInputProps & { maxLength: number }) {
  return (
    <div className="relative group">
      <Textarea
        id={id}
        required
        maxLength={maxLength}
        rows={4}
        dir={dir}
        value={value}
        aria-invalid={invalid || undefined}
        className={cn(inputBaseClasses, "min-h-[110px] resize-none", invalid && "border-destructive ring-destructive/20")}
        onChange={(event) => onChange(event.target.value)}
      />
      <span aria-hidden="true" className={shimmerClasses}>
        <span className={shimmerSweepClasses}>
          <span className="relative h-full w-8 bg-[linear-gradient(270deg,transparent,hsl(var(--foreground)/0.08),transparent)]" />
        </span>
      </span>
    </div>
  );
}
