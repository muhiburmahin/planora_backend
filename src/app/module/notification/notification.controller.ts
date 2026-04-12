/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const filters = pick(req.query, ['isRead', 'type', 'searchTerm']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await NotificationService.getMyNotifications(user.id, filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications fetched successfully",
        meta: result.meta,
        data: result.data
    });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await NotificationService.getUnreadCount(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Unread count fetched successfully",
        data: result
    });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await NotificationService.markAsRead(user.id, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read successfully",
        data: result
    });
});


const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await NotificationService.markAllAsRead(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications marked as read",
        data: result
    });
});


const deleteNotification = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await NotificationService.deleteNotification(user.id, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification deleted successfully",
        data: result
    });
});


const clearAllNotifications = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await NotificationService.clearAllNotifications(user.id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications cleared successfully",
        data: result
    });
});


const deleteOldNotifications = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.deleteOldNotifications();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System cleanup completed successfully",
        data: result
    });
});

export const NotificationController = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    deleteOldNotifications
};