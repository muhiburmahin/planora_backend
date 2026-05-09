import { prisma } from "../../lib/prisma";
import { RequestStatus } from "../../../generated/prisma/client";

const getUserDashboardStats = async (userId: string) => {
  const totalEventsOrganized = await prisma.event.count({
    where: {
      organizerId: userId,
      isDeleted: false,
    },
  });

  const totalJoinedEvents = await prisma.participation.count({
    where: {
      userId: userId,
      status: RequestStatus.APPROVED, // Mapping 'ACCEPTED' to 'APPROVED' as per enum
    },
  });

  const pendingInvitations = await prisma.invitation.count({
    where: {
      receiverId: userId,
      status: RequestStatus.PENDING,
    },
  });

  const recentEvents = await prisma.event.findMany({
    where: {
      organizerId: userId,
      isDeleted: false,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });

  return {
    totalEventsOrganized,
    totalJoinedEvents,
    pendingInvitations,
    recentEvents,
  };
};

export const DashboardService = {
  getUserDashboardStats,
};
