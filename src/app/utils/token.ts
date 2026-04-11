import { Response } from "express";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { CookieUtils } from './cookie';
import { envVars } from "../config/env";

const getAccessToken = (payload: JwtPayload) => {
    return jwt.sign(payload, envVars.JWT_ACCESS_SECRET as string, {
        expiresIn: envVars.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    });
};

const getRefreshToken = (payload: JwtPayload) => {
    return jwt.sign(payload, envVars.JWT_REFRESH_SECRET as string, {
        expiresIn: envVars.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });
};

const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret as Secret) as JwtPayload;
};


const setTokensInCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = envVars.NODE_ENV === 'production';

    // Access Token Cookie
    CookieUtils.setCookie(res, 'accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24, // 1 Day
    });

    CookieUtils.setCookie(res, 'refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 Days
    });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
    const isProduction = envVars.NODE_ENV === 'production';

    CookieUtils.setCookie(res, "better-auth.session_token", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 Days
    });
};

export const tokenUtils = {
    getAccessToken,
    getRefreshToken,
    verifyToken,
    setTokensInCookies,
    setBetterAuthSessionCookie,
};