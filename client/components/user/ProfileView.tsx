"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Mail, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { CURRENT_USER_QUERY_KEY } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { authUserSchema } from "@/lib/validations/login";

export function ProfileView() {
  const locale = useLocale();
  const t = useTranslations("profile");
  const userQuery = useQuery({
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

  if (userQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        <div className="animate-pulse overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="h-40 bg-muted sm:h-48" />
          <div className="space-y-5 p-6 sm:p-8">
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center" role="alert">
          <p className="font-medium text-foreground">{t("loadError")}</p>
          <Button type="button" onClick={() => void userQuery.refetch()} className="mt-4">
            {t("retry")}
          </Button>
        </div>
      </main>
    );
  }

  const { name, email, avatar, phone, address, role, createdAt } = userQuery.data;
  const memberSince = createdAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(createdAt))
    : t("notProvided");

  const profileDetails = [
    { label: t("email"), value: email, icon: Mail },
    { label: t("phone"), value: phone || t("notProvided"), icon: Phone },
    { label: t("address"), value: address || t("notProvided"), icon: MapPin },
    { label: t("memberSince"), value: memberSince, icon: CalendarDays },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl shadow-primary/5">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent sm:h-44">
          <div aria-hidden="true" className="absolute -end-10 -top-24 h-64 w-64 rounded-full border-[40px] border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-28 start-1/3 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-5 start-6 flex items-center gap-2 rounded-full border border-white/20 bg-black/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:start-8">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {role}
          </div>
        </div>

        <div className="px-6 pb-7 sm:px-8 sm:pb-9">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-card bg-background text-primary shadow-lg sm:h-28 sm:w-28">
              {avatar ? (
                <div className="relative h-full w-full">
                  <Image src={avatar} alt="" fill sizes="112px" className="object-cover" />
                </div>
              ) : (
                <UserRound className="h-11 w-11 sm:h-12 sm:w-12" aria-hidden="true" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold tracking-[0.16em] text-primary">{t("eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">{name}</h1>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold tracking-tight text-foreground">{t("detailsTitle")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profileDetails.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 transition-colors hover:border-primary/25 hover:bg-muted/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
