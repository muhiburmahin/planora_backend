/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import { AuthService } from "./auth.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { envVars } from "../../config/env";
import { tokenUtils } from "../../utils/token";
import { auth } from "../../lib/auth";

const cookieOptions = {
    secure: envVars.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'none' as const,
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);

    const { accessToken, refreshToken } = result;

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 30
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully. Please check your email for verification.",
        data: result,
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);

    const { accessToken, refreshToken } = result;

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 30
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 365
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully",
        data: result,
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const token = req.params.token as string; // Type casted to string

    const result = await AuthService.verifyEmail(token);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await AuthService.forgetPassword(email);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.params.token as string; // Type casted to string

    const result = await AuthService.resetPassword(token, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    const result = await AuthService.getMe(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User data retrieved successfully",
        data: result,
    });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;

    const result = await AuthService.changePassword(user.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await AuthService.refreshToken(refreshToken);

    res.cookie('accessToken', result.accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "New access token generated successfully!",
        data: null,
    });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Session ended: Logged out successfully!",
        data: null,
    });
});



const googleLogin = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";
    const encodedRedirectPath = encodeURIComponent(redirectPath);

    const callbackURL = `${envVars.BACKEND_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;

    res.redirect(`${envVars.BACKEND_URL}/api/v1/auth/login/social?provider=google&callbackURL=${callbackURL}`);
});

const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
    const redirectPath = (req.query.redirect as string) || "/dashboard";
    const sessionToken = req.cookies["better-auth.session_token"];

    if (!sessionToken) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
    }

    const session = await auth.api.getSession({
        headers: {
            "Cookie": `better-auth.session_token=${sessionToken}`
        }
    });

    if (!session || !session.user) {
        return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
    }

    const result = await AuthService.googleLoginSuccess(session);
    const { accessToken, refreshToken } = result;

    tokenUtils.setTokensInCookies(res, accessToken, refreshToken);

    const isValidRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//");
    const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";

    res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
});

const handleOAuthError = catchAsync((req: Request, res: Response) => {
    const error = (req.query.error as string) || "oauth_failed";
    res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});
export const AuthController = {
    registerUser,
    loginUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    getMe,
    changePassword,
    getNewToken,
    logoutUser,
    googleLogin,
    googleLoginSuccess,
    handleOAuthError
};