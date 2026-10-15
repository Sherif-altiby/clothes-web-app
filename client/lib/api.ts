import axios from "axios";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

type ApiLocale = "en" | "ar";

let apiLocale: ApiLocale | undefined;

export const setApiLocale = (locale: ApiLocale) => {
    apiLocale = locale;
    api.defaults.headers.common["Accept-Language"] = locale;
};

api.interceptors.request.use((request) => {
    const routeLocale =
        typeof window === "undefined"
            ? undefined
            : window.location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
    const locale = routeLocale === "ar" || routeLocale === "en" ? routeLocale : apiLocale ?? "en";

    request.headers.set("Accept-Language", locale);
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
    const locale = pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1] ?? "en";
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
        const requestUrl = request?.url ?? "";
        const isAuthRequest = /^\/auth\/(login|register|refresh|logout)(?:\/|$)/.test(requestUrl);
        const isCurrentUserRequest = /^\/auth\/me(?:\/|$)/.test(requestUrl);
        const isCartReadRequest =
            request?.method?.toLowerCase() === "get" && /^\/user\/cart(?:\/|$)/.test(requestUrl);
        const isFavoritesReadRequest =
            request?.method?.toLowerCase() === "get" && /^\/user\/favorites(?:\/|$)/.test(requestUrl);
        const shouldAvoidLoginRedirect =
            isCurrentUserRequest || isCartReadRequest || isFavoritesReadRequest;

        if (!request || isAuthRequest || request._retry) {
            if (request?._retry && !shouldAvoidLoginRedirect) redirectToLogin();
            return Promise.reject(error);
        }

        request._retry = true;

        try {
            await refreshSession();
            return await api.request(request);
        } catch (refreshError) {
            if (!shouldAvoidLoginRedirect) redirectToLogin();
            return Promise.reject(refreshError);
        }
    }
);
