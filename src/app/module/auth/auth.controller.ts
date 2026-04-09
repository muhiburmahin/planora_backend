import { Request, Response } from "express";
import httpStatus from "http-status";
import { AuthService } from "./auth.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUser(req.body);
    const { accessToken, refreshToken, user } = result;

    res.cookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully!",
        data: {
            accessToken,
            refreshToken,
            user
        },
    });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUser(req.body);
    const { accessToken, refreshToken, user } = result;

    res.cookie('refreshToken', refreshToken, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully!",
        data: {
            accessToken,
            refreshToken,
            user
        },
    });
});

export const AuthController = {
    registerUser,
    loginUser
};