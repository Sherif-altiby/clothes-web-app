import axios, { type InternalAxiosRequestConfig } from "axios";

export { axios };

export const USER_FAVORITES_ENDPOINT = "/user/favorites";

type ApiLocale = "en" | "ar";

export const getRouteLocale = (): ApiLocale => {
  if (typeof window === "undefined") return "en";

  const locale = window.location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
  return locale === "ar" ? "ar" : "en";
};

const matchesEndpoint = (url: string, endpoint: string) => {
  const path = url.split("?")[0]?.replace(/\/+$/, "") ?? "";
  return path === endpoint || path.startsWith(`${endpoint}/`);
};

export const isPublicReadRequest = (request: InternalAxiosRequestConfig) => {
  if (request.method?.toLowerCase() !== "get") return false;

  const url = request.url ?? "";
  return (
    matchesEndpoint(url, "/auth/me") ||
    matchesEndpoint(url, "/user/cart") ||
    matchesEndpoint(url, USER_FAVORITES_ENDPOINT)
  );
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((request) => {
  request.headers.set("Accept-Language", getRouteLocale());
  return request;
});

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

let refreshRequest: Promise<void> | null = null;

const refreshSession = () => {
  if (!refreshRequest) {
    refreshRequest = api
      .post("/auth/refresh")
      .then(() => undefined)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

const redirectToLogin = () => {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  const locale = getRouteLocale();
  const loginPath = `/${locale}/login`;

  if (pathname !== loginPath) {
    const returnTo = encodeURIComponent(`${pathname}${search}`);
    window.location.assign(`${loginPath}?returnTo=${returnTo}`);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config;
    if (!request) return Promise.reject(error);

    const requestUrl = request.url ?? "";
    const isAuthRequest = /^\/auth\/(login|register|refresh|logout)(?:\/|$)/.test(requestUrl);
    const isCurrentUserRequest = matchesEndpoint(requestUrl, "/auth/me");
    const isPublicRead = isPublicReadRequest(request);

    if (isCurrentUserRequest) return Promise.reject(error);

    if (isAuthRequest || request._retry) {
      if (request._retry && !isPublicRead) redirectToLogin();
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      await refreshSession();
      return await api(request);
    } catch (refreshError) {
      if (!isPublicRead) redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);
