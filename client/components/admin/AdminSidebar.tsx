"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "radix-ui";
import {
  ClipboardList,
  Hexagon,
  MessageSquareText,
  Package,
  PanelRightClose,
  PanelRightOpen,
  PanelsTopLeft,
  Shield,
  Store,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavKey =
  | "products"
  | "categories"
  | "orders"
  | "reviews"
  | "hero"
  | "moderators";

type SectionKey = "catalog" | "sales" | "storefront" | "team";

type NavItem = { href: string; key: NavKey; icon: LucideIcon };

/** Navigation is grouped by the job the admin is doing, not as one flat list. */
const sections: { key: SectionKey; items: NavItem[] }[] = [
  {
    key: "catalog",
    items: [
      { href: "/admin", key: "products", icon: Package },
      { href: "/admin/categories", key: "categories", icon: Tags },
    ],
  },
  {
    key: "sales",
    items: [
      { href: "/admin/orders", key: "orders", icon: ClipboardList },
      { href: "/admin/reviews", key: "reviews", icon: MessageSquareText },
    ],
  },
  {
    key: "storefront",
    items: [{ href: "/admin/hero", key: "hero", icon: PanelsTopLeft }],
  },
  {
    key: "team",
    items: [{ href: "/admin/moderators", key: "moderators", icon: Shield }],
  },
];

const text = {
  ar: {
    subtitle: "لوحة الإدارة",
    navLabel: "التنقل الإداري",
    store: "العودة إلى المتجر",
    collapse: "طيّ الشريط الجانبي",
    expand: "توسيع الشريط الجانبي",
    sections: {
      catalog: "الكتالوج",
      sales: "المبيعات",
      storefront: "واجهة المتجر",
      team: "الفريق",
    },
    items: {
      products: "المنتجات",
      categories: "الفئات",
      orders: "الطلبات",
      reviews: "التقييمات",
      hero: "الواجهة الرئيسية",
      moderators: "المشرفون",
    },
  },
} as const;

/**
 * Every row uses the same 64px icon cell, which is exactly the width of the
 * collapsed rail's content area. Icons therefore never move when the sidebar
 * expands or collapses; only the labels fade in and out.
 */
const rowBase =
  "group flex h-11 w-full items-center overflow-hidden rounded-xl text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const iconCell = "flex w-16 shrink-0 items-center justify-center";

function Hint({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip.Root open={enabled ? undefined : false}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="left"
          sideOffset={10}
          className="z-[70] rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 motion-reduce:animate-none"
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

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
  // Fixed: Arabic copy, RTL direction, docked to the right edge.
  const t = text.ar;

  // Sidebar is on the right, so tooltips open to its left (inward).
  const ToggleIcon = isCollapsed ? PanelRightOpen : PanelRightClose;

  const labelClass = cn(
    "truncate whitespace-nowrap pe-4 transition-opacity duration-200 motion-reduce:transition-none",
    isCollapsed ? "opacity-0" : "opacity-100"
  );

  return (
    <Tooltip.Provider delayDuration={150}>
      <aside
        dir="rtl"
        className={cn(
          "relative z-40 flex h-dvh shrink-0 flex-col border-e border-border bg-background",
          "transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none",
          "lg:fixed lg:inset-y-0 lg:right-0",
          isCollapsed ? "w-[88px]" : "w-[260px]"
        )}
      >
        {/* Header: brand + collapse/expand toggle.
            Expanded: one row, toggle at the end. Collapsed: stacked, both centered. */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 px-3",
            isCollapsed ? "flex-col pb-2 pt-3" : "h-16"
          )}
        >
          <Link
            href={`/${locale}/admin`}
            className={cn(
              "flex h-11 items-center overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCollapsed ? "w-full" : "min-w-0 flex-1"
            )}
          >
            <span className={iconCell}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Hexagon className="h-5 w-5" aria-hidden="true" />
              </span>
            </span>
            <span
              className={cn(
                "flex min-w-0 flex-col",
                isCollapsed && "sr-only"
              )}
            >
              <span className="text-sm font-extrabold leading-none tracking-tight text-foreground">
                VELNORA
              </span>
              <span className="mt-1 truncate text-xs text-muted-foreground">
                {t.subtitle}
              </span>
            </span>
          </Link>

          <Hint label={t.expand} enabled={isCollapsed}>
            <button
              type="button"
              onClick={() => onCollapsedChange(!isCollapsed)}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? t.expand : t.collapse}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ToggleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </Hint>
        </div>

        {/* Navigation */}
        <nav
          aria-label={t.navLabel}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3"
        >
          {sections.map((section, index) => (
            <div
              key={section.key}
              role="group"
              aria-label={t.sections[section.key]}
              className="space-y-1"
            >
              {/* Group heading when open; hairline divider when collapsed */}
              {isCollapsed ? (
                index > 0 && (
                  <div
                    role="separator"
                    className="mx-4 mb-2 mt-3 h-px bg-border"
                  />
                )
              ) : (
                <p
                  className={cn(
                    "px-3 pb-1 text-xs font-medium text-muted-foreground",
                    index === 0 ? "pt-1" : "pt-5"
                  )}
                >
                  {t.sections[section.key]}
                </p>
              )}

              {section.items.map(({ href, key, icon: Icon }) => {
                const fullHref = `/${locale}${href}`;
                const active =
                  href === "/admin"
                    ? pathname === fullHref
                    : pathname === fullHref ||
                      pathname.startsWith(`${fullHref}/`);

                return (
                  <Hint
                    key={href}
                    label={t.items[key]}
                    enabled={isCollapsed}
                  >
                    <Link
                      href={fullHref}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        rowBase,
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={iconCell}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className={labelClass}>{t.items[key]}</span>
                    </Link>
                  </Hint>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-1 border-t border-border p-3">
          <Hint label={t.store} enabled={isCollapsed}>
            <Link
              href={`/${locale}`}
              className={cn(
                rowBase,
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={iconCell}>
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={labelClass}>{t.store}</span>
            </Link>
          </Hint>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}