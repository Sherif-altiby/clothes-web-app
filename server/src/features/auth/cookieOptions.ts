import { Response } from "express";
import { ACCESS_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_MAX_AGE_MS } from "./tokens";
 
const isProduction = process.env.NODE_ENV === "production";

const baseOptions = {
    httpOnly: true, // JavaScript can't read the cookies, which limits the damage of an XSS bug
    secure: isProduction, // HTTPS only in production
    sameSite: "strict" as const, // not sent on cross-site requests, which blocks CSRF
};

// The refresh cookie is only sent to the auth routes, not on every API request.
// This MUST match the path where you mount the auth router: app.use("/api/auth", authRoutes)
export const REFRESH_COOKIE_PATH = "/api/auth";

export const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }) => {
    res.cookie("accessToken", tokens.accessToken, {
        ...baseOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
        ...baseOptions,
        path: REFRESH_COOKIE_PATH,
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
};

// clearCookie only works when the flags and path match the ones used to set the cookie
export const clearAuthCookies = (res: Response) => {
    res.clearCookie("accessToken", baseOptions);
    res.clearCookie("refreshToken", { ...baseOptions, path: REFRESH_COOKIE_PATH });
};