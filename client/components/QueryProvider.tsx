"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { axios } from "@/lib/api";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (
              query.meta?.ignoreUnauthorizedError === true &&
              axios.isAxiosError(error) &&
              error.response?.status === 401
            ) {
              return;
            }

            const errorMessage = query.meta?.errorMessage;
            if (typeof errorMessage === "string") {
              toast.error(errorMessage);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
