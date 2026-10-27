"use client";

import { Heart, LogOut, Moon, ShoppingBag, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/validations/login";

interface Category {
  id: string;
  title: string;
}

export function ThemeToggle() {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
    >
      <Moon
        className="h-5 w-5 text-foreground/80 transition-colors hover:text-foreground dark:hidden"
        aria-hidden="true"
      />
      <Sun
        className="hidden h-5 w-5 text-foreground/80 transition-colors hover:text-foreground dark:block"
        aria-hidden="true"
      />
    </Button>
  );
}

function getAlternateLocalePath(pathname: string, locale: string) {
  const segments = pathname.split("/");
  const firstSegment = segments[1];
  const nextLocale = locale === "en" ? "ar" : "en";

  if (firstSegment === "en" || firstSegment === "ar") {
    segments[1] = nextLocale;
  } else {
    segments.splice(1, 0, nextLocale);
  }

  return segments.join("/") || `/${nextLocale}`;
}

export function LangToggle({ locale, pathname }: { locale: string; pathname: string }) {
  const t = useTranslations("nav");

  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={getAlternateLocalePath(pathname, locale)} aria-label={t("toggleLang")}>
        <span className="text-sm font-bold">{locale === "en" ? "AR" : "EN"}</span>
      </Link>
    </Button>
  );
}

export function CategoryNav({
  categories,
  locale,
  pathname,
}: {
  categories: Category[];
  locale: string;
  pathname: string;
}) {
  const t = useTranslations("nav");

  if (categories.length === 0) return null;

  return (
    <nav
      aria-label={t("categories")}
      className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-4 md:flex"
    >
      <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 shadow-inner shadow-foreground/[0.03]">
        {categories.map((category) => {
          const categoryHref = `/${locale}/user/category/${category.id}`;
          const isActive = pathname === categoryHref || pathname.startsWith(`${categoryHref}/`);

          return (
            <Link
              key={category.id}
              href={categoryHref}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group/category relative shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-background/80 hover:text-foreground hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-background text-primary shadow-sm ring-1 ring-primary/15"
                  : "text-muted-foreground"
              )}
            >
              {category.title}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-primary transition-transform duration-200",
                  isActive ? "scale-x-100" : "scale-x-0 group-hover/category:scale-x-100"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function UserMenu({
  user,
  isLoggingOut,
  onLogout,
  locale,
}: {
  user: AuthUser;
  isLoggingOut: boolean;
  onLogout: () => void;
  locale: string;
}) {
  const t = useTranslations("nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("account")}>
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="truncate text-sm font-semibold">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/user/profile`}>
            <UserRound className="me-2 h-4 w-4" aria-hidden="true" />
            {t("account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/user/cart`}>
            <ShoppingBag className="me-2 h-4 w-4" aria-hidden="true" />
            {t("cart")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/user/favourites`}>
            <Heart className="me-2 h-4 w-4" aria-hidden="true" />
            {t("favourites")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={onLogout} className="text-destructive">
          <LogOut className="me-2 h-4 w-4" aria-hidden="true" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
