import { Request, Response } from "express";
import status from "http-status";
import { AuthService } from "./auth.service";
import { tokenUtils } from "../../utils/token";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { envVars } from "../../config/env";
import httpStatus from 'http-status';

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);

    const { accessToken, refreshToken, sessionToken, ...rest } = result;

    tokenUtils.setTokensInCookies(res, accessToken, refreshToken);

    if (sessionToken) {
        tokenUtils.setBetterAuthSessionCookie(res, sessionToken);
    }

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "User registered successfully",
        data: {
            accessToken,
            refreshToken,
            ...rest
        },
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    const { refreshToken, accessToken } = result;

    res.cookie('accessToken', accessToken, {
        secure: envVars.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 30 // ৩০ দিন
    });

    res.cookie('refreshToken', refreshToken, {
        secure: envVars.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 24 * 365
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully",
        data: {
            accessToken,
            refreshToken,
            user: result.user
        },
    });
});

export const AuthController = { registerUser, loginUser };