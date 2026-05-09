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
    const { startDate, endDate } = req.query; 
    let result;

    if (user.role === Role.ADMIN) {
        result = await UserService.getAdminDashboardStats(startDate as string, endDate as string);
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
    const filters = {
        searchTerm: req.query.searchTerm,
        status: req.query.status,
        role: req.query.role,
    };
    const options = {
        limit: Number(req.query.limit) || 10,
        page: Number(req.query.page) || 1,
    };

    const result = await UserService.getAllUsers(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All users retrieved successfully",
        meta: result.meta,
        data: result.data,
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

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const result = await UserService.changeUserRole(id as string, role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User role updated successfully",
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

const markNotificationAsRead = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.markNotificationAsRead(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read",
        data: result,
    });
});

export const UserController = {
    getMyProfile,
    updateMyProfile,
    getDashboardStats,
    getAllUsers,
    changeUserStatus,
    changeUserRole,
    getMyNotifications,
    markNotificationAsRead
};