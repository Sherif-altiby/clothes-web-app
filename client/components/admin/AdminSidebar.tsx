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

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const text = copy[locale === "ar" ? "ar" : "en"];

  return (
    <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-e">
      <div className="flex h-full flex-col">
        <Link
          href={`/${locale}/admin`}
          className="flex items-center gap-3 px-4 pt-4 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring lg:border-b lg:border-border lg:px-6 lg:py-6"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-lg font-black text-background"
          >
            V
          </span>
          <span className="leading-tight">
            <span className="block text-base font-black tracking-wide text-foreground">VELNORA</span>
            <span className="text-xs text-muted-foreground">{text.subtitle}</span>
          </span>
        </Link>

        <nav
          aria-label={text.navLabel}
          className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:p-4"
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
                  "relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 start-0 hidden w-1 rounded-full bg-primary lg:block"
                  />
                )}
                <Icon className={cn("h-4 w-4", active && "text-primary")} aria-hidden="true" />
                {text.items[key]}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-border p-4 lg:block">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            {text.store}
          </Link>
        </div>
      </div>
    </aside>
  );
}