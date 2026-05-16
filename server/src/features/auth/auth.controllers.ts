import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { loginUser, registerUser } from "./auth.services";

export const loginController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    res.status(200).json({ success: true, data: result });
});

export const registerController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await registerUser(req.body);

    res.status(200).json({ success: true, data: result });
});