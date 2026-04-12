import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";
import { NotificationService } from "../notification/notification.service";
import { IInvitationFilterRequest, IInvitationOptions, IInvitationPayload } from "./invitation.interface";
import { paginationHelper } from "../../helpers/paginationHelper";

const sendInvitation = async (senderId: string, payload: IInvitationPayload) => {
    const { eventId, receiverId } = payload;
    if (senderId === receiverId) throw new AppError(httpStatus.BAD_REQUEST, "Self-invitation is not allowed.");

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(httpStatus.NOT_FOUND, "Event not found.");

    const isMember = await prisma.participation.findFirst({ where: { eventId, userId: receiverId } });
    if (isMember) throw new AppError(httpStatus.BAD_REQUEST, "User is already a participant.");

    return await prisma.$transaction(async (tx) => {
        const invitation = await tx.invitation.upsert({
            where: { eventId_receiverId: { eventId, receiverId } },
            update: { status: 'PENDING', senderId, message: payload.message },
            create: { ...payload, senderId },
            include: { sender: { select: { name: true } }, event: { select: { title: true } } }
        });

        await NotificationService.createNotification(
            receiverId,
            `${invitation.sender.name} invited you to "${invitation.event.title}"`,
            "EVENT_INVITATION",
            `/events/${eventId}`
        );
        return invitation;
    });
};

const respondToInvitation = async (userId: string, id: string, status: 'ACCEPTED' | 'REJECTED') => {
    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation || invitation.receiverId !== userId) throw new AppError(httpStatus.NOT_FOUND, "Invitation not found.");
    if (invitation.status !== 'PENDING') throw new AppError(httpStatus.BAD_REQUEST, `Already ${invitation.status.toLowerCase()}`);

    return await prisma.$transaction(async (tx) => {
        const updated = await tx.invitation.update({ where: { id }, data: { status } });
        if (status === 'ACCEPTED') {
            await tx.participation.create({
                data: { eventId: invitation.eventId, userId: invitation.receiverId, status: 'CONFIRMED' }
            });
        }
        await NotificationService.createNotification(
            invitation.senderId,
            `Invitation was ${status.toLowerCase()}`,
            "SYSTEM",
            `/events/${invitation.eventId}`
        );
        return updated;
    });
};

const getMyInvitations = async (userId: string) => {
    return await prisma.invitation.findMany({
        where: { receiverId: userId },
        include: { sender: { select: { name: true, image: true } }, event: true },
        orderBy: { createdAt: 'desc' }
    });
};

const getSentInvitations = async (userId: string) => {
    return await prisma.invitation.findMany({
        where: { senderId: userId },
        include: { receiver: { select: { name: true, image: true } }, event: true },
        orderBy: { createdAt: 'desc' }
    });
};

const getSingleInvitation = async (userId: string, id: string) => {
    const result = await prisma.invitation.findUnique({
        where: { id },
        include: { sender: true, receiver: true, event: true }
    });
    if (!result || (result.senderId !== userId && result.receiverId !== userId))
        throw new AppError(httpStatus.FORBIDDEN, "Unauthorized access.");
    return result;
};

const getAllInvitations = async (filters: IInvitationFilterRequest, options: IInvitationOptions) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = filters;
    const andConditions: Prisma.InvitationWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: [
                { event: { title: { contains: searchTerm, mode: 'insensitive' } } },
                { message: { contains: searchTerm, mode: 'insensitive' } }
            ]
        });
    }
    if (Object.keys(filterData).length > 0) {
        andConditions.push({ AND: Object.keys(filterData).map(key => ({ [key]: (filterData as any)[key] })) });
    }

    const whereConditions: Prisma.InvitationWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await prisma.invitation.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: 'desc' },
        include: { sender: true, receiver: true, event: true }
    });
    const total = await prisma.invitation.count({ where: whereConditions });
    return { meta: { total, page, limit }, data: result };
};

const withdrawInvitation = async (userId: string, id: string) => {
    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation || invitation.senderId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Access denied.");
    return await prisma.invitation.delete({ where: { id } });
};

const cleanupInvitations = async () => {
    return await prisma.invitation.deleteMany({
        where: { OR: [{ status: 'REJECTED' }, { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }] }
    });
};

export const InvitationService = {
    sendInvitation, respondToInvitation, getMyInvitations, getSentInvitations,
    getSingleInvitation, getAllInvitations, withdrawInvitation, cleanupInvitations
};