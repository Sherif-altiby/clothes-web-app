"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { loginResponseSchema, loginSchema, type LoginInput } from "@/lib/validations/login";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<ApiResponse<unknown>>("/auth/login", credentials);
      const parsed = loginResponseSchema.safeParse(response.data.data);

      if (!parsed.success) {
        throw new Error("invalidResponse");
      }

      return parsed.data.user;
    },
    onSuccess: (user) => {
      toast.success(t("success"));
      router.replace(user.role === "USER" ? `/${locale}/user` : `/${locale}/admin`);
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || t("errors.requestFailed")
        : error instanceof Error && error.message === "invalidResponse"
          ? t("errors.invalidResponse")
          : t("errors.requestFailed");

      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof LoginInput, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    loginMutation.mutate(parsed.data);
  };

  const emailError = errors.email;
  const passwordError = errors.password;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-xl shadow-primary/5 sm:p-9">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-primary">VELNORA</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "email-error" : undefined}
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                className="w-full rounded-xl border border-input bg-background py-3 pe-4 ps-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 aria-invalid:border-destructive"
              />
            </div>
            {emailError && (
              <p id="email-error" className="text-sm text-destructive">
                {t(`validation.${emailError}`)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              {t("password")}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "password-error" : undefined}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                className="w-full rounded-xl border border-input bg-background py-3 ps-10 pe-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20 aria-invalid:border-destructive"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="text-sm text-destructive">
                {t(`validation.${passwordError}`)}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 disabled:translate-y-0"
          >
            {loginMutation.isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </section>
    </main>
  );
}
