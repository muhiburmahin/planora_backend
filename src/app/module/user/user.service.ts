/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestStatus, UserStatus, PaymentStatus } from '../../../generated/prisma/client';
import AppError from '../../errorHelpers/appError';
import { prisma } from '../../lib/prisma';
import { IAdminDashboardStats, IUserDashboardStats, IUserUpdatePayload } from './user.interface';
import httpStatus from 'http-status';

const getMyProfile = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        include: { profile: true }
    });
};

const updateMyProfile = async (userId: string, payload: IUserUpdatePayload) => {
    const { name, image, ...profileData } = payload;

    return await prisma.$transaction(async (tx) => {
        if (name || image) {
            await tx.user.update({
                where: { id: userId },
                data: { name, image }
            });
        }
        await tx.profile.upsert({
            where: { userId },
            update: profileData,
            create: { userId, ...profileData }
        });

        return tx.user.findUnique({ where: { id: userId }, include: { profile: true } });
    });
};

// Admin Dashboard: Performance optimized with aggregation
const getAdminDashboardStats = async (startDate?: string, endDate?: string): Promise<IAdminDashboardStats> => {
    const dateFilter = startDate && endDate ? { 
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) } 
    } : {};

   
    const [totalUsers, recentUsers, totalEvents, totalParticipations, revenueData] = await Promise.all([
        prisma.user.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { createdAt: dateFilter.createdAt, isDeleted: false } }),
        prisma.event.count(),
        prisma.participation.count({ where: { createdAt: dateFilter.createdAt } }),
      
        prisma.payment.aggregate({
            where: { paymentStatus: PaymentStatus.PAID, createdAt: dateFilter.createdAt },
            _sum: { amount: true }
        })
    ]);

    const userGrowthRate = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(2) : "0.00";

    const categoryDistribution = await prisma.category.findMany({
        select: { name: true, _count: { select: { events: true } } }
    });

    return {
        summary: {
            totalUsers,
            totalEvents,
            totalRevenue: revenueData._sum.amount || 0,
            userGrowthRate: `${userGrowthRate}%`,
            totalParticipations
        },
        categoryDistribution,
        recentActivities: await prisma.participation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, image: true } }, event: { select: { title: true } } }
        })
    } as any;
};

const getUserDashboardStats = async (userId: string): Promise<IUserDashboardStats> => {
    const [myEvents, myJoined, myReviews, pendingInvites] = await Promise.all([
        prisma.event.count({ where: { organizerId: userId } }),
        prisma.participation.count({ where: { userId, status: RequestStatus.APPROVED } }),
        prisma.review.count({ where: { userId } }),
        prisma.invitation.count({ where: { receiverId: userId, status: RequestStatus.PENDING } })
    ]);

    return {
        stats: {
            myOrganizedEvents: myEvents,
            myJoinedEvents: myJoined,
            totalReviewsGiven: myReviews,
            pendingInvitations: pendingInvites
        },
        upcomingEvents: await prisma.participation.findMany({
            where: {
                userId,
                status: RequestStatus.APPROVED,
                event: { date: { gte: new Date() } }
            },
            include: { event: true },
            take: 3,
            orderBy: { event: { date: 'asc' } }
        })
    };
};

const getAllUsers = async () => {
    return await prisma.user.findMany({
        where: { isDeleted: false },
        include: { profile: { select: { contactNumber: true, address: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

const changeUserStatus = async (id: string, status: UserStatus) => {
    const isUserExist = await prisma.user.findUnique({
        where: { id, isDeleted: false }
    });

    if (!isUserExist) throw new AppError(httpStatus.NOT_FOUND, "User not found!");

   
    return await prisma.user.update({
        where: { id },
        data: { 
            status,
            isDeleted: status === UserStatus.DELETED
        }
    });
};

const getMyNotifications = async (userId: string) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

const markNotificationAsRead = async (id: string) => {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new AppError(httpStatus.NOT_FOUND, "Notification not found!");

    return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
};

export const UserService = {
    getMyProfile,
    updateMyProfile,
    getAdminDashboardStats,
    getUserDashboardStats,
    getAllUsers,
    changeUserStatus,
    getMyNotifications,
    markNotificationAsRead
};