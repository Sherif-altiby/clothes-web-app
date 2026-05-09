"use client";

import Link from "next/link";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";


export function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

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

  useEffect(() => {
    setMounted(true);
    // Check initial theme preference
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode, mounted]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-1 md:flex-none">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">Velnora</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex flex-1 justify-center space-x-8 text-sm font-medium">
          <Link href="discover/men" className="nav-link "> {t('men')} </Link>
          <Link href="discover/women" className="nav-link ">{t('women')}</Link>
          <Link href="discover/children" className="nav-link ">{t('children')}</Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={t('toggleTheme')}
          >
            {mounted && isDarkMode ? (
              <Sun className="h-5 w-5 text-foreground/80 hover:text-foreground transition-colors" />
            ) : (
              <Moon className="h-5 w-5 text-foreground/80 hover:text-foreground transition-colors" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="ghost" size="icon" asChild>
            <Link href={getToggleLangHref()} aria-label={t('toggleLang')}>
              <span className="font-bold text-sm">{currentLang === 'en' ? 'AR' : 'EN'}</span>
            </Link>
          </Button>

          <Button variant="default" className="hidden sm:flex font-medium">
            <Link href="/login">{t('login')}</Link>
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('menu')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
