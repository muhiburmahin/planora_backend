/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/appError";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        let accessToken = CookieUtils.getCookie(req, 'accessToken');
        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

        // Token extraction: Cookie first, then Authorization Header
        if (!accessToken && req.headers.authorization?.startsWith('Bearer ')) {
            accessToken = req.headers.authorization.split(' ')[1];
        }

        if (!accessToken || !sessionToken) {
            throw new AppError(status.UNAUTHORIZED, 'Authentication tokens missing! Please login.');
        }

        // Optimized Database Query: fetching only necessary fields
        const sessionExists = await prisma.session.findFirst({
            where: {
                token: sessionToken,
                expiresAt: { gt: new Date() }
            },
            select: {
                createdAt: true,
                expiresAt: true,
                user: {
                    select: {
                        id: true,
                        role: true,
                        email: true,
                        status: true,
                        isDeleted: true
                    }
                }
            }
        });

        if (!sessionExists || !sessionExists.user) {
            throw new AppError(status.UNAUTHORIZED, 'Your session has expired. Please login again.');
        }

        // Session refresh logic (UI/UX enhancement)
        const now = new Date();
        const expiresAt = new Date(sessionExists.expiresAt);
        const createdAt = new Date(sessionExists.createdAt);
        const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
        const timeRemaining = expiresAt.getTime() - now.getTime();
        const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

        if (percentRemaining < 20) {
            res.setHeader('X-Session-Refresh', 'true');
        }

        // JWT Validation
        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.JWT_ACCESS_SECRET as string);

        if (!verifiedToken.success) {
            throw new AppError(status.UNAUTHORIZED, 'Invalid or expired access token!');
        }

        const user = sessionExists.user;

        // Security check: Blocked or Deleted user
        if (user.status === UserStatus.BLOCKED || user.isDeleted) {
            throw new AppError(status.FORBIDDEN, 'Your account is inactive or deleted.');
        }

        // RBAC check
        if (authRoles.length > 0 && !authRoles.includes(user.role as Role)) {
            throw new AppError(status.FORBIDDEN, 'You do not have permission to access this resource!');
        }

        // Attaching user to request object
        req.user = {
            id: user.id,
            role: user.role as Role,
            email: user.email,
        };

        next();
    } catch (error: any) {
        next(error);
    }
};