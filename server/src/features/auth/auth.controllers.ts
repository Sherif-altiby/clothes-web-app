import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { clearAuthCookies, setAuthCookies } from "./cookieOptions";
import {
    getMe,
    loginUser,
    logoutAllDevices,
    logoutUser,
    refreshSession,
    registerUser,
    updateProfile,
} from "./auth.services";

export const loginController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const { user, tokens } = await loginUser(email, password);

    // Tokens travel in httpOnly cookies only, never in the JSON body
    setAuthCookies(res, tokens);

    res.status(200).json({ success: true, data: { user } });
});

export const registerController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await registerUser(req.body);

    res.status(201).json({ success: true, data: { user } });
});

export const refreshController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokens = await refreshSession(req.cookies?.refreshToken);

        setAuthCookies(res, tokens);

        res.status(200).json({ success: true, message: "Token refreshed" });
    } catch (error) {
        // A failed refresh means the session is over, so don't leave dead cookies behind
        clearAuthCookies(res);
        throw error;
    }
});

export const logoutController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await logoutUser(req.cookies?.refreshToken);

    clearAuthCookies(res);

    res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const logoutAllController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await logoutAllDevices(req.user!.userId);

    clearAuthCookies(res);

    res.status(200).json({ success: true, message: "Logged out from all devices" });
});

export const getMeController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await getMe(req.user!.userId);

    res.status(200).json({ success: true, data: user });
});

export const updateProfileController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await updateProfile(req.user!.userId, req.body);

    res.status(200).json({ success: true, data: user });
});