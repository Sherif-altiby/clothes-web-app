import axios from "axios";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
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
        const isAuthRequest = /^\/auth\/(login|register|refresh)(?:\/|$)/.test(requestUrl);

        if (!request || isAuthRequest || request._retry) {
            if (request?._retry) redirectToLogin();
            return Promise.reject(error);
        }

        request._retry = true;

        try {
            await refreshSession();
            return await api.request(request);
        } catch (refreshError) {
            redirectToLogin();
            return Promise.reject(refreshError);
        }
    }
);
