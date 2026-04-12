import { Notification, NotificationType, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { socketHelper } from "../../utils/socket";
import { INotificationFilterRequest, INotificationOptions } from "./notification.interface";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";

const createNotification = async (
    userId: string,
    message: string,
    type: NotificationType,
    link: string = "#"
): Promise<Notification> => {
    const notification = await prisma.notification.create({
        data: { userId, message, type, link },
        include: {
            user: {
                select: { email: true, name: true }
            }
        }
    });

    // সকেট নোটিফিকেশন কাজ করবে
    socketHelper.emitNotification(userId, notification);

    // Redis কিউ সাময়িকভাবে বন্ধ রাখা হলো
    /*
    await notificationQueue.add('sendEmail', {
        email: notification.user.email,
        subject: `Planora: ${type.split('_').join(' ')}`,
        message: `Hi ${notification.user.name || 'User'}, <br/> ${message} <br/> <a href="${link}">View Details</a>`
    }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true
    });
    */

    return notification;
};

// ... বাকি ফাংশনগুলো আগের মতোই থাকবে (সেগুলোতে কোনো পরিবর্তন নেই)
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
    return { unreadCount: count };
};

const markAsRead = async (userId: string, id: string): Promise<Notification> => {
    const isExist = await prisma.notification.findFirst({
        where: { id, userId }
    });

    if (!isExist) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
};

const markAllAsRead = async (userId: string): Promise<Prisma.BatchPayload> => {
    return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
    });
};

const deleteNotification = async (userId: string, id: string): Promise<Notification> => {
    const isExist = await prisma.notification.findFirst({
        where: { id, userId }
    });

    if (!isExist) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    return await prisma.notification.delete({
        where: { id }
    });
};

const clearAllNotifications = async (userId: string): Promise<Prisma.BatchPayload> => {
    return await prisma.notification.deleteMany({
        where: { userId }
    });
};

const deleteOldNotifications = async (): Promise<Prisma.BatchPayload> => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await prisma.notification.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
    });
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