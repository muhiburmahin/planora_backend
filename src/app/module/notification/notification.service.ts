/* eslint-disable @typescript-eslint/no-explicit-any */
import { Notification, NotificationType, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { socketHelper } from "../../utils/socket";
import { INotificationFilterRequest, INotificationOptions } from "./notification.interface";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";
import { sendEmail } from "../../utils/sendEmail";

const createNotification = async (
    userId: string,
    message: string,
    type: NotificationType,
    link: string = "#"
): Promise<Notification> => {
    try {
        console.log(`\x1b[36m[Notification-Attempt]\x1b[0m User: ${userId} | Type: ${type}`);

        const notification = await prisma.notification.create({
            data: { userId, message, type, link },
            include: {
                user: {
                    select: { email: true, name: true }
                }
            }
        });

        console.log(`\x1b[32m[Notification-Success]\x1b[0m Created with ID: ${notification.id}`);

        if (userId && notification) {
            socketHelper.emitNotification(userId, notification);
        }

        if (notification.user?.email) {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const fullLink = `${frontendUrl}${link}`;

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    .container { max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff; }
                    .header { background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 30px; text-align: center; color: white; }
                    .content { padding: 40px; line-height: 1.6; color: #333; }
                    .alert-box { background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 20px; margin: 25px 0; border-radius: 4px; }
                    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); }
                    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0; font-size: 28px; letter-spacing: 1px;">Planora</h1>
                    </div>
                    <div class="content">
                        <h2 style="color: #111827; margin-top: 0;">New Activity Update</h2>
                        <p>Hi <strong>${notification.user.name || 'User'}</strong>,</p>
                        <p>You have a new notification regarding your account activity on Planora.</p>
                        
                        <div class="alert-box">
                            <p style="margin: 0; font-size: 16px; color: #4b5563;">"${message}"</p>
                        </div>

                        <div style="text-align: center;">
                            <a href="${fullLink}" class="btn">View Details in App</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                            If the button doesn't work, copy and paste this link: <br>
                            <span style="color: #4f46e5;">${fullLink}</span>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Planora Team. All rights reserved.</p>
                        <p>You are receiving this because you signed up for Planora.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            sendEmail(
                notification.user.email,
                `Planora Update: ${message.substring(0, 40)}...`,
                emailHtml
            ).catch(err => console.error("Notification Email Error:", err));
        }

        return notification;

    } catch (error: any) {
        console.error(`\x1b[31m[Notification-Error]\x1b[0m Failed:`, error.message);
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