import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import httpStatus from "http-status";
import AppError from "./appError";

const auth = (...roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization;
            if (!token) throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");

            const decoded = jwt.verify(token, envVars.JWT_ACCESS_SECRET as string) as JwtPayload;

            if (roles.length && !roles.includes(decoded.role)) {
                throw new AppError(httpStatus.FORBIDDEN, "Forbidden access!");
            }

            req.user = decoded;
            next();
        } catch (err) {
            next(new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token!"));
        }
    };
};

export default auth;