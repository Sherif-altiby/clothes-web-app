"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { CURRENT_USER_QUERY_KEY } from "@/lib/query-keys";
import { authUserSchema } from "@/lib/validations/login";

interface Category {
  id: string;
  title: string;
}

export function useCurrentUser() {
  const t = useTranslations("nav");

  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<{ data: unknown }>("/auth/me");
      const parsed = authUserSchema.safeParse(response.data.data);

      if (!parsed.success) {
        throw new Error("invalidResponse");
      }

      return parsed.data;
    },
    meta: {
      errorMessage: t("authStatusError"),
      ignoreUnauthorizedError: true,
    },
    retry: false,
  });
}

export function useLogout(locale: string) {
  const t = useTranslations("nav");
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ success: boolean }>("/auth/logout");

      if (!response.data.success) {
        throw new Error("logoutFailed");
      }
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success(t("logoutSuccess"));
      router.replace(`/${locale}`);
    },
    onError: () => {
      toast.error(t("logoutError"));
    },
  });
}

export function useCategories(locale: string, pathname: string) {
  return useQuery({
    queryKey: ["categories", locale],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>("/user/categories");
      return response.data.data;
    },
    enabled: !/^\/(?:en|ar)\/user\/profile(?:\/|$)/.test(pathname),
    staleTime: 5 * 60_000,
  });
}
