/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import crypto from "crypto";
import jwt, { Secret } from 'jsonwebtoken';
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { envVars } from "../../config/env";
import { sendEmail } from "../../utils/sendEmail";
import {
    IRegisterUserPayload,
    ILoginUserPayload,
    IJWTPayload
} from "./auth.interface";
import AppError from "../../errorHelpers/appError";

const registerUser = async (payload: IRegisterUserPayload) => {
    const authData: any = await auth.api.signUpEmail({
        body: {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        }
    });

    if (!authData || !authData.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to create user in Auth system");
    }

    try {
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const finalData = await prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id: authData.user.id },
                data: { verificationToken: verificationToken }
            });

            const profile = await tx.profile.upsert({
                where: { userId: authData.user.id },
                update: {},
                create: {
                    userId: authData.user.id,
                    bio: "Welcome to Planora!",
                    contactNumber: "",
                    address: ""
                }
            });

            return { updatedUser, profile };
        });

        const verifyURL = `${envVars.BACKEND_URL}/api/v1/auth/verify-email/${verificationToken}`;

        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }
                .header { background-color: #4CAF50; padding: 20px; text-align: center; color: white; }
                .content { padding: 30px; line-height: 1.6; color: #333; }
                .btn { display: inline-block; background-color: #4CAF50; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #777; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>Planora</h1></div>
                <div class="content">
                    <h2>Verify Your Email</h2>
                    <p>Hi <strong>${payload.name}</strong>,</p>
                    <p>Welcome to Planora! To complete your registration and secure your account, please verify your email address.</p>
                    <div style="text-align: center;">
                        <a href="${verifyURL}" class="btn">Verify Email Address</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link: <br> <span style="color: #4CAF50;">${verifyURL}</span></p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Planora Team. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await sendEmail(
            payload.email,
            "Action Required: Verify Your Planora Account",
            htmlTemplate
        );

        const jwtPayload: IJWTPayload = {
            id: authData.user.id,
            email: authData.user.email,
            role: (authData.user.role as any) || "USER",
        };

        return {
            accessToken: tokenUtils.getAccessToken(jwtPayload),
            refreshToken: tokenUtils.getRefreshToken(jwtPayload),
            user: finalData.updatedUser,
            profile: finalData.profile
        };

    } catch (error: any) {
        await prisma.user.delete({ where: { id: authData.user.id } }).catch(() => { });
        console.error("Registration Process Error:", error);
        throw new AppError(
            status.INTERNAL_SERVER_ERROR,
            error.message || "Registration failed during setup"
        );
    }
};

const loginUser = async (payload: ILoginUserPayload) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email, isDeleted: false }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found!");
    }

    if (!user.emailVerified) {
        throw new AppError(status.FORBIDDEN, "Please verify your email first!");
    }

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

    return {
        accessToken: tokenUtils.getAccessToken(jwtPayload),
        refreshToken: tokenUtils.getRefreshToken(jwtPayload),
        user: data.user
    };
};

const verifyEmail = async (token: string) => {
    const user = await prisma.user.findFirst({
        where: { verificationToken: token }
    });

    if (!user) {
        throw new AppError(status.BAD_REQUEST, "Invalid or expired verification token!");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verificationToken: null,
        }
    });

    return { message: "Email verified successfully! You can now login." };
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const forgetPassword = async (email: string) => {
    const user = await prisma.user.findUnique({
        where: { email, isDeleted: false }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "No active user found with this email!");
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
        where: { email },
        data: {
            passwordResetToken: otp,
            passwordResetExpires: otpExpires
        }
    });

    await sendEmail(
        user.email,
        "Your Planora Reset OTP",
        `<div style="font-family: sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4A90E2;">Password Reset OTP</h2>
            <p>Your 6-digit OTP for resetting Planora password is:</p>
            <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
            <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
        </div>`
    );

    return { message: "A 6-digit OTP has been sent to your email!" };
};

const resetPassword = async (otp: string, payload: { newPassword: string }) => {
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: otp,
            passwordResetExpires: { gt: new Date() }
        }
    });

    if (!user) throw new AppError(status.BAD_REQUEST, "Invalid or expired OTP!");

    const hashedPassword = await hashPassword(payload.newPassword);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpires: null,
                needPasswordChange: false
            }
        }),
        prisma.account.updateMany({
            where: { userId: user.id, providerId: "credential" },
            data: { password: hashedPassword }
        })
    ]);

    return { message: "Password reset successfully! Now login with new password." };
};

const changePassword = async (userId: string, payload: any) => {
    const { oldPassword, newPassword } = payload;
    if (oldPassword === newPassword) throw new AppError(status.BAD_REQUEST, "New password cannot be the same!");

    const account = await prisma.account.findFirst({ where: { userId, providerId: "credential" } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentHashedPassword = account?.password || user?.password;

    if (!currentHashedPassword) throw new AppError(status.NOT_FOUND, "Authentication record not found!");

    const isPasswordMatch = await verifyPassword({
        hash: currentHashedPassword,
        password: oldPassword
    });
    if (!isPasswordMatch) throw new AppError(status.BAD_REQUEST, "Invalid current password!");

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { password: newHashedPassword, needPasswordChange: false } }),
        prisma.account.updateMany({ where: { userId, providerId: "credential" }, data: { password: newHashedPassword } })
    ]);

    return { message: "Password changed successfully!" };
};

const refreshToken = async (token: string) => {
    if (!token) {
        throw new AppError(status.UNAUTHORIZED, "Session expired, please login again!");
    }

    try {
        const decoded = jwt.verify(
            token,
            envVars.JWT_REFRESH_SECRET as Secret
        ) as IJWTPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id, isDeleted: false }
        });

        if (!user || (user as any).status === 'BLOCKED') {
            throw new AppError(status.FORBIDDEN, "User account is inactive!");
        }

        const jwtPayload: IJWTPayload = {
            id: user.id,
            email: user.email,
            role: user.role as any,
        };

        return {
            accessToken: tokenUtils.getAccessToken(jwtPayload)
        };
    } catch {
        throw new AppError(status.UNAUTHORIZED, "Invalid refresh token!");
    }
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            profile: true
        }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, "User profile not found!");
    }

    return user;
};

const googleLoginSuccess = async (session: any) => {

    const isProfileExists = await prisma.profile.findUnique({
        where: { userId: session.user.id }
    });

    if (!isProfileExists) {
        await prisma.profile.create({
            data: {
                userId: session.user.id,
                bio: "Welcome to Planora!",
                contactNumber: "",
                address: ""
            }
        });
    }

    const accessToken = tokenUtils.getAccessToken({
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
    });

    const refreshToken = tokenUtils.getRefreshToken({
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
    });

    return { accessToken, refreshToken };
};

export const AuthService = {
    registerUser,
    loginUser,
    verifyEmail,
    forgetPassword,
    resetPassword,
    getMe,
    changePassword,
    refreshToken,
    googleLoginSuccess
};