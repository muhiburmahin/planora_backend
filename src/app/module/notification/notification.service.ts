/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notification, NotificationType, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { socketHelper } from "../../utils/socket";
import { INotificationFilterRequest, INotificationOptions } from "./notification.interface";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";
import { sendEmail } from "../../utils/sendEmail";
import { getNotificationEmailHtml } from "../../shared/notificationTemplate";


const createNotification = async (
    userId: string,
    message: string,
    type: NotificationType,
    link: string = "#"
): Promise<Notification> => {
    try {
        console.log(`\x1b[36m[Notification-Attempt]\x1b[0m User: ${userId} | Type: ${type}`);

        const [notification] = await prisma.$transaction([
            prisma.notification.create({
                data: { userId, message, type, link },
                include: {
                    user: {
                        select: { email: true, name: true }
                    }
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { unreadCount: { increment: 1 } }
            })
        ]);

        console.log(`\x1b[32m[Notification-Success]\x1b[0m Created with ID: ${notification.id}`);

        // Socket logic
        if (userId && notification) {
            socketHelper.emitNotification(userId, notification);
        }
        
        // Email logic
        if (notification.user?.email) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const fullLink = `${frontendUrl}${link}`;

            const emailHtml = getNotificationEmailHtml(
                notification.user.name || "User",
                message,
                fullLink
            );

            sendEmail(
                notification.user.email,
                `Planora Update: ${message.substring(0, 40)}...`,
                emailHtml
            ).catch(err => console.error("Notification Email Error:", err));
        }

        return notification;

    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`\x1b[31m[Notification-Error]\x1b[0m Failed:`, error.message);
        } else {
            console.error(`\x1b[31m[Notification-Error]\x1b[0m An unexpected error occurred`);
        }
        throw error;
    }
};

const getMyNotifications = async (
    userId: string,
    filters: INotificationFilterRequest,
    options: INotificationOptions
) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (Number(page) - 1) * Number(limit);
    const { isRead, type, searchTerm } = filters;

    const andConditions: Prisma.NotificationWhereInput[] = [{ userId }];

    if (isRead !== undefined) {
        andConditions.push({ isRead: isRead === 'true' });
    }
    if (type) {
        andConditions.push({ type });
    }
    if (searchTerm) {
        andConditions.push({
            message: { contains: searchTerm, mode: 'insensitive' }
        });
    }

    const whereConditions: Prisma.NotificationWhereInput = { AND: andConditions };

    const [result, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: whereConditions,
            skip,
            take: Number(limit),
            orderBy: { [sortBy as string]: sortOrder },
        }),
        prisma.notification.count({ where: whereConditions }),
        prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            unreadCount
        },
        data: result
    };
};

const getUnreadCount = async (userId: string) => {
    const count = await prisma.notification.count({
        where: { userId, isRead: false }
    });

    return {
        count,
        timestamp: new Date()
    };
};


const markAsRead = async (userId: string, id: string): Promise<Notification> => {
    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    if (notification.userId !== userId) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to access this notification");
    }

    return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
};


const markAllAsRead = async (userId: string) => {
    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });

    return {
        message: "All notifications marked as read",
        count: result.count
    };
};


const deleteNotification = async (userId: string, id: string) => {
    const notification = await prisma.notification.findFirst({
        where: { id, userId }
    });

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found or access denied");
    }

    const deletedData = await prisma.notification.delete({
        where: { id }
    });

    return {
        id: deletedData.id,
        deletedAt: new Date(),
        status: "DELETED"
    };
};


const clearAllNotifications = async (userId: string) => {
    const result = await prisma.notification.deleteMany({
        where: { userId }
    });

    return {
        message: "Notification history cleared successfully",
        deletedCount: result.count
    };
};


const deleteOldNotifications = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
        where: {
            createdAt: { lt: thirtyDaysAgo },
            isRead: true
        }
    });

    return {
        clearedAt: new Date(),
        removedCount: result.count
    };
};

export const NotificationService = {
    createNotification,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    deleteOldNotifications
};