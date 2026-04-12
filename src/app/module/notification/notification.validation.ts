import { z } from "zod";
import { NotificationType } from "../../../generated/prisma/client";

const getNotificationsQuery = z.object({
    query: z.object({
        isRead: z.enum(['true', 'false']).optional(),
        type: z.nativeEnum(NotificationType).optional(),
        page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
        limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    }),
});

const markAsRead = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Invalid Notification ID format" }),
    }),
    body: z.object({
        isRead: z.boolean().optional()
    })
});
export const NotificationValidations = {
    getNotificationsQuery,
    markAsRead,
};