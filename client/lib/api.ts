import axios from "axios";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            typeof window !== "undefined"
        ) {
            const { pathname, search } = window.location;
            const locale = pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1] ?? "en";
            const loginPath = `/${locale}/login`;

            if (pathname !== loginPath) {
                const returnTo = encodeURIComponent(`${pathname}${search}`);
                window.location.assign(`${loginPath}?returnTo=${returnTo}`);
            }
        }

        return Promise.reject(error);
    }
);
