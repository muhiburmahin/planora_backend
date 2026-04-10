/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

const createToken = (
    payload: Record<string, unknown>,
    secret: Secret,
    options: SignOptions
): string => {
    return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret) => {
    try {
        if (!secret) {
            throw new Error("JWT Secret is missing!");
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        return {
            success: true,
            data: decoded,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Token verification failed",
        };
    }
};

const decodeToken = (token: string): JwtPayload | null => {
    return jwt.decode(token) as JwtPayload;
};

export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken,
};