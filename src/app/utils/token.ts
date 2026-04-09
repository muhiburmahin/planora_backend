import { Response } from "express";
import { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { CookieUtils } from './cookie';
import { envVars } from "../config/env";

const getAccessToken = (payload: JwtPayload) => {
    return jwtUtils.createToken(
        payload,
        envVars.JWT_ACCESS_SECRET as Secret,
        { expiresIn: envVars.JWT_ACCESS_EXPIRES_IN as string } as SignOptions
    );
};

const getRefreshToken = (payload: JwtPayload) => {
    return jwtUtils.createToken(
        payload,
        envVars.JWT_REFRESH_SECRET as Secret,
        { expiresIn: envVars.JWT_REFRESH_EXPIRES_IN as string } as SignOptions
    );
};

const setTokensInCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = envVars.NODE_ENV === 'production';

    // Access Token Cookie
    CookieUtils.setCookie(res, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    // Refresh Token Cookie
    CookieUtils.setCookie(res, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    const isProduction = envVars.NODE_ENV === 'production';

    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    });
};

export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    setTokensInCookies,
    setBetterAuthSessionCookie,
};