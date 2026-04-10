/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { IRegisterUserPayload, ILoginUserPayload, IJWTPayload } from "./auth.interface";
import AppError from "../../errorHelpers/appError";

const registerUser = async (payload: IRegisterUserPayload) => {
    const data: any = await auth.api.signUpEmail({
        body: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        }
    });

    if (!data || !data.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to create user in Auth system");
    }

    try {
        const profileData = await prisma.$transaction(async (tx) => {
            const result = await tx.profile.create({
                data: {
                    userId: data.user.id,
                    bio: "",
                    contactNumber: "",
                    address: ""
                }
            });
            return result;
        });

        const jwtPayload: IJWTPayload = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role as any,
        };

        const accessToken = tokenUtils.getAccessToken(jwtPayload);
        const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

        return {
            token: data.session?.token || data.token,
            accessToken,
            refreshToken,
            sessionToken: data.token || data.session?.token,
            user: data.user,
            profile: profileData
        };

    } catch (error: any) {
        await prisma.user.delete({ where: { id: data.user.id } });
        throw new AppError(status.INTERNAL_SERVER_ERROR, error.message || "Registration failed");
    }
};

const loginUser = async (payload: ILoginUserPayload) => {
    const data: any = await auth.api.signInEmail({
        body: {
            email: payload.email,
            password: payload.password,
        }
    });

    if (!data || !data.user) {
        throw new AppError(status.UNAUTHORIZED, "Invalid email or password");
    }

    const jwtPayload: IJWTPayload = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as any,
    };

    const accessToken = tokenUtils.getAccessToken(jwtPayload);
    const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

    return {
        token: data.session?.token || data.token,
        accessToken,
        refreshToken,
        sessionToken: data.token || data.session?.token,
        user: data.user
    };
};

export const AuthService = { registerUser, loginUser };