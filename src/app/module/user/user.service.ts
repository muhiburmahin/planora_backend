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


    const [totalUsers, recentUsers, totalEvents, totalReviews, totalParticipations, pendingInvitations, revenueData] = await Promise.all([
        prisma.user.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { createdAt: dateFilter.createdAt, isDeleted: false } }),
        prisma.event.count(),
        prisma.review.count(),
        prisma.participation.count({ where: { createdAt: dateFilter.createdAt } }),
        prisma.invitation.count({ where: { status: RequestStatus.PENDING } }),
        prisma.payment.aggregate({
            where: { paymentStatus: PaymentStatus.PAID, createdAt: dateFilter.createdAt },
            _sum: { amount: true }
        })
    ]);

    const userGrowthRate = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(2) : "0.00";

    const categoryDistribution = await prisma.category.findMany({
        select: { name: true, _count: { select: { events: true } } }
    });

    // Monthly Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEvents = await prisma.event.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: sixMonthsAgo } },
        _count: { id: true }
    });

    // Simple grouping for the trend
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrendMap: Record<string, { month: string, events: number, users: number }> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mName = months[d.getMonth()];
        monthlyTrendMap[mName] = { month: mName, events: 0, users: 0 };
    }

    // Fill event counts
    monthlyEvents.forEach(item => {
        const mName = months[item.createdAt.getMonth()];
        if (monthlyTrendMap[mName]) {
            monthlyTrendMap[mName].events += item._count.id;
        }
    });

    return {
        summary: {
            totalUsers,
            totalEvents,
            totalReviews,
            totalRevenue: revenueData._sum.amount || 0,
            userGrowthRate: `${userGrowthRate}%`,
            totalParticipations,
            pendingInvitations
        },
        categoryDistribution,
        monthlyTrend: Object.values(monthlyTrendMap),
        recentActivities: await prisma.participation.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, image: true, email: true } }, event: { select: { title: true } } }
        })
    } as any;
};

const getUserDashboardStats = async (userId: string): Promise<any> => {
    const [myEvents, myJoined, pendingInvites, recentParticipations] = await Promise.all([
        prisma.event.count({ where: { organizerId: userId, isDeleted: false } }),
        prisma.participation.count({ where: { userId, status: RequestStatus.APPROVED } }),
        prisma.invitation.count({ where: { receiverId: userId, status: RequestStatus.PENDING } }),
        prisma.participation.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    include: { category: { select: { name: true } } }
                }
            }
        })
    ]);

    const recentEvents = recentParticipations.map(p => ({
        id: p.event.id,
        title: p.event.title,
        date: p.event.date,
        time: p.event.time,
        venue: p.event.venue,
        shortDescription: p.event.shortDescription,
        category: {
            name: p.event.category.name
        },
        status: p.event.status
    }));

    return {
        totalEventsOrganized: myEvents,
        totalJoinedEvents: myJoined,
        pendingInvitations: pendingInvites,
        recentEvents
    };
};

const getAllUsers = async (filters: any, options: any) => {
    const { searchTerm, status, role } = filters;
    const { limit, page } = options;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (searchTerm) {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    if (status) where.status = status;
    if (role) where.role = role;

    const [data, total] = await Promise.all([
        prisma.user.findMany({
            where,
            include: { profile: { select: { contactNumber: true, address: true } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.user.count({ where }),
    ]);

    return {
        meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
        data,
    };
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

const changeUserRole = async (id: string, role: any) => {
    const isUserExist = await prisma.user.findUnique({
        where: { id, isDeleted: false }
    });

    if (!isUserExist) throw new AppError(httpStatus.NOT_FOUND, "User not found!");

    return await prisma.user.update({
        where: { id },
        data: { role }
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
    changeUserRole,
    getMyNotifications,
    markNotificationAsRead
};