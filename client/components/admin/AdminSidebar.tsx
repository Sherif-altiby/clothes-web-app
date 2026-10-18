"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  MessageSquareText,
  Package,
  PanelsTopLeft,
  Shield,
  Store,
  Tags,
  ChevronLeft,
  ChevronRight,
  Hexagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", key: "products", icon: Package },
  { href: "/admin/categories", key: "categories", icon: Tags },
  { href: "/admin/orders", key: "orders", icon: ClipboardList },
  { href: "/admin/reviews", key: "reviews", icon: MessageSquareText },
  { href: "/admin/hero", key: "hero", icon: PanelsTopLeft },
  { href: "/admin/moderators", key: "moderators", icon: Shield },
] as const;

type NavKey = (typeof navigation)[number]["key"];

const copy: Record<
  "ar" | "en",
  { subtitle: string; navLabel: string; store: string; items: Record<NavKey, string> }
> = {
  ar: {
    subtitle: "لوحة الإدارة",
    navLabel: "التنقل الإداري",
    store: "العودة إلى المتجر",
    items: {
      products: "المنتجات",
      categories: "الفئات",
      orders: "الطلبات",
      reviews: "التقييمات",
      hero: "الواجهة الرئيسية",
      moderators: "المشرفون",
    },
  },
  en: {
    subtitle: "Admin panel",
    navLabel: "Admin navigation",
    store: "Back to store",
    items: {
      products: "Products",
      categories: "Categories",
      orders: "Orders",
      reviews: "Reviews",
      hero: "Homepage hero",
      moderators: "Moderators",
    },
  },
};

export function AdminSidebar({
  locale,
  isCollapsed,
  onCollapsedChange,
}: {
  locale: string;
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}) {
  const pathname = usePathname();
  const text = copy.ar;
  const isRtl = true;

  return (
    // Outer wrapper for the floating layout spacing
    <div
      className={cn(
        "relative z-40 flex h-screen flex-col py-4 px-3 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] lg:fixed lg:inset-y-0 lg:right-0",
        isCollapsed ? "w-[88px]" : "w-[260px]"
      )}
      dir="rtl"
    >
      {/* The Floating Sidebar Panel */}
      <aside className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/60 shadow-xl shadow-black/5 backdrop-blur-xl">

        {/* --- Header --- */}
        <div className="flex h-20 shrink-0 items-center px-4 border-b border-border/40 relative">
          <Link
            href={`/${locale}/admin`}
            className={cn(
              "flex items-center gap-3 overflow-hidden outline-none transition-all duration-300",
              isCollapsed && "justify-center w-full"
            )}
          >
            {/* Premium Gradient Logo */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Hexagon className="h-5 w-5 text-primary-foreground drop-shadow-sm" />
            </div>

            <div
              className={cn(
                "flex flex-col transition-all duration-300 text-right",
                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
              )}
            >
              <span className="text-sm font-extrabold tracking-tight text-foreground leading-none">
                VELNORA
              </span>
              <span className="text-[11px] font-medium text-muted-foreground mt-1">
                {text.subtitle}
              </span>
            </div>
          </Link>
        </div>

        {/* --- Navigation --- */}
        <nav
          aria-label={text.navLabel}
          className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-thumb-border"
        >
          {navigation.map(({ href, key, icon: Icon }) => {
            const fullHref = `/${locale}${href}`;
            const active =
              href === "/admin"
                ? pathname === fullHref
                : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

            return (
              <Link
                key={href}
                href={fullHref}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium outline-none transition-all duration-300",
                  "hover:bg-muted/50",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                  isCollapsed && "justify-center px-0"
                )}
              >
                {/* Active Indicator (Left side for RTL) */}
                {active && !isCollapsed && (
                  <span className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-primary" />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
                  )}
                  aria-hidden="true"
                />

                <span
                  className={cn(
                    "truncate transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                  )}
                >
                  {text.items[key]}
                </span>

                {/* Frosted Glass Tooltip (Collapsed State) */}
                {isCollapsed && (
                  <div
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 z-50 hidden group-hover:block",
                      "whitespace-nowrap rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-foreground shadow-xl",
                      "animate-in fade-in slide-in-from-left-2 duration-200",
                      isRtl ? "right-full mr-4 slide-in-from-right-2" : "left-full ml-4"
                    )}
                  >
                    {text.items[key]}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* --- Footer (Back to Store) --- */}
        <div className="shrink-0 border-t border-border/40 p-3">
          <Link
            href={`/${locale}`}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground outline-none transition-all duration-300 hover:bg-muted/50 hover:text-foreground",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Store className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-foreground" aria-hidden="true" />

            <span
              className={cn(
                "truncate transition-all duration-300",
                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              )}
            >
              {text.store}
            </span>

            {/* Tooltip for Footer item */}
            {isCollapsed && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-50 hidden group-hover:block",
                  "whitespace-nowrap rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-foreground shadow-xl",
                  "animate-in fade-in duration-200",
                  isRtl ? "right-full mr-4" : "left-full ml-4"
                )}
              >
                {text.store}
              </div>
            )}
          </Link>
        </div>

        {/* --- Elegant Collapse Toggle Button --- */}
        <button
          onClick={() => onCollapsedChange(!isCollapsed)}
          className={cn(
            "absolute top-6 flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-sm outline-none transition-all duration-300 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            // Positioning inside the padding instead of hanging off the edge
            "left-2",
            // If collapsed, center it in the header
            isCollapsed && "left-1/2 -translate-x-1/2 rtl:translate-x-1/2"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {
            isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          }
        </button>
      </aside>
    </div>
  );
}