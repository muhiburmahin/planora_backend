/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { UserService } from './user.service';
import { Role } from '../../../generated/prisma';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await UserService.getMyProfile(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile fetched successfully",
        data: result,
    });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await UserService.updateMyProfile(user.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully",
        data: result,
    });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    let result;

    if (user.role === Role.ADMIN) {
        result = await UserService.getAdminDashboardStats();
    } else {
        result = await UserService.getUserDashboardStats(user.id);
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard summary retrieved successfully",
        data: result,
    });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllUsers();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All users retrieved successfully",
        data: result,
    });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await UserService.changeUserStatus(id as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User status updated successfully",
        data: result,
    });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await UserService.getMyNotifications(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications retrieved successfully",
        data: result,
    });
});

export const UserController = {
    getMyProfile,
    updateMyProfile,
    getDashboardStats,
    getAllUsers,
    changeUserStatus,
    getMyNotifications
};