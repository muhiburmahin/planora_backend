import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { envVars } from '../../config/env';
import AppError from '../../middleware/appError';
import { tokenUtils } from '../../utils/token';
import { IJWTPayload, IUser } from './auth.interface';

const registerUser = async (payload: IUser) => {
    const isExist = await prisma.user.findUnique({
        where: { email: payload.email }
    });

    if (isExist) throw new AppError(httpStatus.BAD_REQUEST, "User already exists!");
    const hashedPassword = await bcrypt.hash(
        payload.password as string,
        Number(envVars.BCRYPT_SALT_ROUNDS)
    );
    const result = await prisma.user.create({
        data: {
            ...payload,
            password: hashedPassword
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userData } = result;
    const jwtPayload: IJWTPayload = {
        id: result.id,
        email: result.email,
        role: result.role
    };

    const accessToken = tokenUtils.getAccessToken(jwtPayload);
    const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

    return {
        accessToken,
        refreshToken,
        user: userData
    };
};

const loginUser = async (payload: Pick<IUser, 'email' | 'password'>) => {
    const user = await prisma.user.findUnique({
        where: { email: payload.email }
    });

    if (!user || user.isDeleted || user.status === 'BLOCKED') {
        throw new AppError(httpStatus.NOT_FOUND, "User not found or blocked!");
    }

    const isMatch = await bcrypt.compare(payload.password as string, user.password);
    if (!isMatch) throw new AppError(httpStatus.FORBIDDEN, "Password incorrect!");
    const jwtPayload: IJWTPayload = {
        id: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = tokenUtils.getAccessToken(jwtPayload);
    const refreshToken = tokenUtils.getRefreshToken(jwtPayload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userData } = user;

    return {
        accessToken,
        refreshToken,
        user: userData
    };
};

export const AuthService = {
    registerUser,
    loginUser
};