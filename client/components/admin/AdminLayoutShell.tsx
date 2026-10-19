"use client";

import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

export function AdminLayoutShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className="flex min-h-screen flex-row bg-muted/20 font-[family-name:var(--font-cairo)] lg:flex-row"
      dir="rtl"
    >
      <AdminSidebar
        locale={locale}
        isCollapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
      />
      <div
        aria-hidden="true"
        className={cn(
          "hidden shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] lg:block",
          isSidebarCollapsed ? "w-[88px]" : "w-[260px]"
        )}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
