/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { envVars } from "../config/env";
import { jwtUtils } from "../utils/jwt";
import AppError from "../errorHelpers/appError";

const auth = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            let token: string | undefined;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            } else if (req.cookies && req.cookies.accessToken) {
                token = req.cookies.accessToken;
            }

            if (!token) {
                throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized! Token missing.");
            }

            const result = jwtUtils.verifyToken(token, envVars.JWT_ACCESS_SECRET as string);

            if (!result.success) {
                throw new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token!");
            }

            const decoded = result.data as any;

            if (roles.length && !roles.includes(decoded.role)) {
                throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to access this resource!");
            }

            req.user = decoded;
            next();
        } catch (err: any) {
            next(err);
        }
    };
};

export default auth;