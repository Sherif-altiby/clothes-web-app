"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
 
const SHOP_LINKS = [
    { key: "women", href: "user/category/women" },
    { key: "men", href: "user/category/men" },
    { key: "kids", href: "user/category/kids" },
    { key: "shoes", href: "user/category/shoes" },
    { key: "accessories", href: "user/category/accessories" },
] as const;

const HELP_LINKS = [
    { key: "tracking", href: "/help/tracking" },
    { key: "shipping", href: "/help/shipping-returns" },
    { key: "sizeGuide", href: "/help/size-guide" },
    { key: "contact", href: "/help/contact" },
] as const;

const COMPANY_LINKS = [
    { key: "about", href: "/about" },
    { key: "careers", href: "/careers" },
    { key: "sustainability", href: "/sustainability" },
    { key: "stores", href: "/stores" },
] as const;

const SOCIAL_LINKS = [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "YouTube", href: "https://youtube.com" },
];

function LinkColumn({
    title,
    links,
    t,
}: {
    title: string;
    links: readonly { key: string; href: string }[];
    t: (key: string) => string;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <ul className="space-y-2.5">
                {links.map((l) => (
                    <li key={l.key}>
                        <Link
                            href={l.href}
                            className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                            {t(l.key)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Footer() {
    const t = useTranslations("footer");
    const tCat = useTranslations("home.categories");
    const [email, setEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        // TODO: send `email` to your newsletter provider / API route
        setSubscribed(true);
        setEmail("");
    };

    return (
        <footer className="mt-8 border-t border-border/40 bg-muted/20">
            <div className="container mx-auto px-4 py-12">
                {/* Newsletter */}
                <div className="flex flex-col gap-6 rounded-3xl border border-border/50 bg-card/40 p-8 backdrop-blur-md md:flex-row md:items-center md:justify-between md:p-10">
                    <div className="max-w-md space-y-1">
                        <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl">
                            {t("newsletter.title")}
                        </h2>
                        <p className="text-sm text-muted-foreground">{t("newsletter.description")}</p>
                    </div>

                    {subscribed ? (
                        <p className="text-sm font-medium text-primary animate-in fade-in duration-300">
                            ✓ {t("newsletter.thanks")}
                        </p>
                    ) : (
                        <form onSubmit={handleSubscribe} className="flex w-full flex-col gap-3 sm:flex-row md:max-w-md">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t("newsletter.placeholder")}
                                aria-label={t("newsletter.placeholder")}
                                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                            />
                            <Button type="submit" size="lg" className="h-12 rounded-xl px-6 text-sm font-bold">
                                {t("newsletter.cta")}
                            </Button>
                        </form>
                    )}
                </div>

                {/* Link columns */}
                <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 space-y-4 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-primary">
                            Velnora
                        </Link>
                        <p className="max-w-xs text-sm text-muted-foreground">{t("tagline")}</p>
                    </div>
                    <LinkColumn title={t("shop")} links={SHOP_LINKS} t={(k) => tCat(k)} />
                    <LinkColumn title={t("help")} links={HELP_LINKS} t={(k) => t(`links.${k}`)} />
                    <LinkColumn title={t("company")} links={COMPANY_LINKS} t={(k) => t(`links.${k}`)} />
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col gap-4 border-t border-border/40 pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-muted-foreground">
                        {t("rights", { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        {SOCIAL_LINKS.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {s.label}
                            </a>
                        ))}
                        <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-primary">
                            {t("privacy")}
                        </Link>
                        <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-primary">
                            {t("terms")}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}