import { Request, Response, NextFunction } from "express";

export const SUPPORTED_LANGS = ["ar", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const langMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // ?lang=ar wins, otherwise use the Accept-Language header (e.g. "ar-EG,ar;q=0.9,en;q=0.8")
    const raw = (req.query.lang as string) || req.headers["accept-language"] || "";
    const code = raw.slice(0, 2).toLowerCase();

    req.lang = (SUPPORTED_LANGS as readonly string[]).includes(code)
        ? (code as Lang)
        : DEFAULT_LANG;

    res.setHeader("Content-Language", req.lang);
    res.setHeader("Vary", "Accept-Language");

    next();
};