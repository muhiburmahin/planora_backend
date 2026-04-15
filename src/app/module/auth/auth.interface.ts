import { Role, UserStatus } from "../../../generated/prisma/client";


export interface IRegisterUserPayload {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "ADMIN";
}

export interface ILoginUserPayload {
    email: string;
    password: string;
}

export interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    emailVerified: boolean;
    image?: string | null;
    role: Role;
    status: UserStatus;
    needPasswordChange: boolean;
    isDeleted: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IJWTPayload {
    id: string;
    email: string;
    role: Role;
}

export interface ILoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface ICookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'none' | 'strict';
    path: string;
    maxAge: number;
}