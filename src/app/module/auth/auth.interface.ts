import { Role, UserStatus } from "../../../generated/prisma/client";

export interface IUser {
    id: string;
    name: string;
    email: string;
    password?: string;
    emailVerified: boolean;
    image?: string | null;
    role: Role; // USER | ADMIN
    status: UserStatus; // ACTIVE | BLOCKED
    needPasswordChange: boolean;
    isDeleted: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ILoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface IJWTPayload {
    id: string;
    email: string;
    role: Role;
}

export interface ICookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'none' | 'strict';
    path: string;
    maxAge: number;
}