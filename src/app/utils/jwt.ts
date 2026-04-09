/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

const createToken = (payload: JwtPayload, secret: Secret, options: SignOptions) => {
    return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret) => {
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        return {
            success: true,
            data: decoded,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Token verification failed",
            error,
        };
    }
};

const decodeToken = (token: string) => {
    return jwt.decode(token) as JwtPayload;
};

export const jwtUtils = {
    createToken,
    verifyToken,
    decodeToken,
};