/* eslint-disable @typescript-eslint/no-explicit-any */
export type IUserUpdatePayload = {
    name?: string;
    image?: string;
    bio?: string;
    contactNumber?: string;
    address?: string;
};

export type IAdminDashboardStats = {
    summary: {
        totalUsers: number;
        totalEvents: number;
        totalReviews: number;
        totalParticipations: number;
        totalRevenue: number;
        userGrowthRate: string;
    };
    categoryDistribution: { name: string; _count: { events: number } }[];
    monthlyTrend: { month: string; events: number; users: number }[];
    recentActivities: any[];
};

export type IUserDashboardStats = {
    stats: {
        myOrganizedEvents: number;
        myJoinedEvents: number;
        totalReviewsGiven: number;
        pendingInvitations: number;
    };
    upcomingEvents: any[];
};