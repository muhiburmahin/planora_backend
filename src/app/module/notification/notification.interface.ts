import { NotificationType } from "../../../generated/prisma/client";

export type INotificationFilterRequest = {
    searchTerm?: string;
    isRead?: string;
    type?: NotificationType;
};

export type INotificationOptions = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};