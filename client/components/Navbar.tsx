"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Heart, LogOut, Moon, ShoppingBag, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { api, setApiLocale } from "@/lib/api";
import { CART_QUERY_KEY } from "@/lib/cart-context";
import { FAVORITES_QUERY_KEY } from "@/lib/favourites-context";
import { authUserSchema } from "@/lib/validations/login";

const THEME_STORAGE_KEY = "theme";
const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ data: unknown }>("/auth/me");
      const parsed = authUserSchema.safeParse(response.data.data);

      if (!parsed.success) {
        throw new Error("invalidResponse");
      }

      return parsed.data;
    },
    retry: false,
  });
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean }>("/auth/logout");

      if (!response.data.success) {
        throw new Error("logoutFailed");
      }
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      queryClient.setQueryData(CART_QUERY_KEY, []);
      queryClient.setQueryData(FAVORITES_QUERY_KEY, []);
      toast.success(t("logoutSuccess"));
      router.replace(`/${currentLang}`);
    },
    onError: () => {
      toast.error(t("logoutError"));
    },
  });

  const isUnauthenticated =
    currentUserQuery.isError &&
    axios.isAxiosError(currentUserQuery.error) &&
    currentUserQuery.error.response?.status === 401;

  useEffect(() => {
    if (currentUserQuery.isError && !isUnauthenticated) {
      toast.error(t("authStatusError"));
    }
  }, [currentUserQuery.error, currentUserQuery.isError, isUnauthenticated, t]);

  const getToggleLangHref = () => {
    if (!pathname) return '/';
    if (pathname.startsWith('/ar')) {
      return pathname.replace('/ar', '/en');
    } else if (pathname.startsWith('/en')) {
      return pathname.replace('/en', '/ar');
    }
    return '/en' + pathname;
  };

  const currentLang = pathname?.startsWith('/ar') ? 'ar' : 'en';

  const categoriesQuery = useQuery({
    queryKey: ["categories", currentLang],
    queryFn: async () => {
      const response = await api.get<{ data: { id: string; title: string }[] }>(
        "/user/categories",
        { headers: { "Accept-Language": currentLang } }
      );
      return response.data.data;
    },
    enabled: !/^\/(?:en|ar)\/user\/profile(?:\/|$)/.test(pathname ?? ""),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    setApiLocale(currentLang);
  }, [currentLang]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const shouldUseDarkMode =
      savedTheme === "dark" ||
      (savedTheme === null && document.documentElement.classList.contains("dark"));
    document.documentElement.classList.toggle("dark", shouldUseDarkMode);
  }, []);

  const toggleTheme = () => {
    const isDarkMode = document.documentElement.classList.toggle("dark");
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-1 md:flex-none">
          <Link href={`/${currentLang}`} className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">Velnora</span>
          </Link>
        </div>

        {categoriesQuery.data?.length ? (
          <nav
            aria-label={t("categories")}
            className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-4 md:flex"
          >
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 shadow-inner shadow-foreground/[0.03]">
              {categoriesQuery.data.map((category) => {
                const categoryHref = `/${currentLang}/user/category/${category.id}`;
                const isActive = pathname === categoryHref || pathname?.startsWith(`${categoryHref}/`);

                return (
                  <Link
                    key={category.id}
                    href={categoryHref}
                    aria-current={isActive ? "page" : undefined}
                    className={`group/category relative shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-background/80 hover:text-foreground hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "bg-background text-primary shadow-sm ring-1 ring-primary/15"
                        : "text-muted-foreground"
                    }`}
                  >
                    {category.title}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-primary transition-transform duration-200 ${
                        isActive ? "scale-x-100" : "scale-x-0 group-hover/category:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}

        {/* Right side actions */}
        <div className="flex shrink-0 items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={t('toggleTheme')}
          >
            <Moon className="h-5 w-5 text-foreground/80 transition-colors hover:text-foreground dark:hidden" />
            <Sun className="hidden h-5 w-5 text-foreground/80 transition-colors hover:text-foreground dark:block" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link
              href={getToggleLangHref()}
              aria-label={t('toggleLang')}
              onClick={() => setApiLocale(currentLang === "en" ? "ar" : "en")}
            >
              <span className="font-bold text-sm">{currentLang === 'en' ? 'AR' : 'EN'}</span>
            </Link>
          </Button>

          {isUnauthenticated && (
            <Button variant="default" className="hidden font-medium sm:flex" asChild>
              <Link href={`/${currentLang}/login`}>{t("login")}</Link>
            </Button>
          )}

          {currentUserQuery.data && (
            <details className="group relative">
              <summary
                aria-label={t("account")}
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-accent hover:text-foreground [&::-webkit-details-marker]:hidden"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="absolute end-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-semibold">{currentUserQuery.data.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{currentUserQuery.data.email}</p>
                </div>
                <Link
                  href={`/${currentLang}/user/profile`}
                  className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <UserRound className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("account")}
                </Link>
                <Link
                  href={`/${currentLang}/user/cart`}
                  className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <ShoppingBag className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("cart")}
                </Link>
                <Link
                  href={`/${currentLang}/user/favourites`}
                  className="flex items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Heart className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("favourites")}
                </Link>
                <button
                  type="button"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  className="flex w-full items-center rounded-md px-3 py-2 text-start text-sm text-destructive transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <LogOut className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("logout")}
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
