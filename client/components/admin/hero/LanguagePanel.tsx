"use client";

import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export function LanguagePanel({
  code,
  dir,
  children,
}: {
  code: string;
  dir: "ltr" | "rtl";
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4 transition-all duration-300 focus-within:border-border/80 focus-within:bg-background focus-within:shadow-sm">
      <Badge
        variant="outline"
        dir={dir}
        className="bg-background px-2.5 py-1 text-xs font-semibold"
      >
        {code}
      </Badge>
      {children}
    </div>
  );
}