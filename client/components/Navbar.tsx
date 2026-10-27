"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { axios } from "@/lib/api";
import { useCategories, useCurrentUser, useLogout } from "./navbar/hooks";
import { CategoryNav, LangToggle, ThemeToggle, UserMenu } from "./navbar/components";

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname() ?? "/";
  const currentLang = useLocale();
  const currentUserQuery = useCurrentUser();
  const logoutMutation = useLogout(currentLang);
  const categoriesQuery = useCategories(currentLang, pathname);
  const isUnauthenticated =
    currentUserQuery.isError &&
    axios.isAxiosError(currentUserQuery.error) &&
    currentUserQuery.error.response?.status === 401;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex-1 md:flex-none">
          <Link href={`/${currentLang}`} className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">Velnora</span>
          </Link>
        </div>

        <CategoryNav
          categories={categoriesQuery.data ?? []}
          locale={currentLang}
          pathname={pathname}
        />

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <LangToggle locale={currentLang} pathname={pathname} />

          {isUnauthenticated && (
            <Button variant="default" className="hidden font-medium sm:flex" asChild>
              <Link href={`/${currentLang}/login`}>{t("login")}</Link>
            </Button>
          )}

          {currentUserQuery.data && (
            <UserMenu
              user={currentUserQuery.data}
              isLoggingOut={logoutMutation.isPending}
              onLogout={() => logoutMutation.mutate()}
              locale={currentLang}
            />
          )}
        </div>
      </div>
    </header>
  );
}
