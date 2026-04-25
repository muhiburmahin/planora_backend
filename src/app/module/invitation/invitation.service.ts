/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, RequestStatus, NotificationType, EventStatus, UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status";
import { NotificationService } from "../notification/notification.service";
import { IInvitationFilterRequest, IInvitationOptions, IInvitationPayload } from "./invitation.interface";
import { paginationHelper } from "../../helper/paginationHelper";

const sendInvitation = async (senderId: string, payload: IInvitationPayload) => {
    const { eventId, receiverId, message } = payload;

    if (senderId === receiverId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Self-invitation is restricted.");
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(httpStatus.NOT_FOUND, "Event not found.");

    const inactiveStatuses: EventStatus[] = [EventStatus.CANCELLED, EventStatus.COMPLETED];
    if (inactiveStatuses.includes(event.status)) {
        throw new AppError(httpStatus.BAD_REQUEST, `Invitation forbidden. Event is already ${event.status.toLowerCase()}.`);
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
        throw new AppError(httpStatus.NOT_FOUND, "Recipient user not found.");
    }
    if (receiver.status !== UserStatus.ACTIVE) {
        throw new AppError(httpStatus.BAD_REQUEST, "Recipient user is not active.");
    }

    const isAlreadyMember = await prisma.participation.findFirst({
        where: { eventId, userId: receiverId }
    });
    if (isAlreadyMember) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is already a participant of this event.");
    }

    const invitationResult = await prisma.$transaction(async (tx) => {
        return await tx.invitation.upsert({
            where: {
                eventId_receiverId: { eventId, receiverId }
            },
            update: {
                status: RequestStatus.PENDING,
                senderId,
                message,
                createdAt: new Date()
            },
            create: {
                eventId,
                receiverId,
                senderId,
                message,
                status: RequestStatus.PENDING
            },
            include: {
                sender: { select: { name: true } },
                event: { select: { title: true } }
            }
        });
    });

    try {
        await NotificationService.createNotification(
            receiverId,
            `${invitationResult.sender.name} invited you to "${invitationResult.event.title}".`,
            NotificationType.INVITATION_RECEIVED,
            `/events/${eventId}`
        );
    } catch (error) {
        console.error("Notification delivery failed:", error);
    }

    return invitationResult;
};

const respondToInvitation = async (userId: string, id: string, status: RequestStatus) => {
   
    const invitation = await prisma.invitation.findUnique({
        where: { id },
        include: { event: { select: { status: true, title: true, registrationFee: true } } }
    });

    if (!invitation || invitation.receiverId !== userId) {
        throw new AppError(httpStatus.NOT_FOUND, "Invitation not found.");
    }

    if (invitation.status !== RequestStatus.PENDING) {
        throw new AppError(httpStatus.BAD_REQUEST, `Already processed as ${invitation.status.toLowerCase()}.`);
    }

    if (invitation.event.status === EventStatus.CANCELLED) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot respond to a cancelled event.");
    }

    return await prisma.$transaction(async (tx) => {
        const updated = await tx.invitation.update({ where: { id }, data: { status } });

        if (status === RequestStatus.APPROVED) {
           
            const isPaidEvent = invitation.event.registrationFee > 0;

            await tx.participation.create({
                data: { 
                    eventId: invitation.eventId, 
                    userId: invitation.receiverId, 
                    status: isPaidEvent ? RequestStatus.PENDING : RequestStatus.APPROVED 
                }
            });
        }

        await NotificationService.createNotification(
            invitation.senderId,
            `Invitation for "${invitation.event.title}" was ${status.toLowerCase()}.`,
            NotificationType.SYSTEM_ALERT,
            `/events/${invitation.eventId}`
        );

        return updated;
    });
};

const getAllInvitations = async (filters: IInvitationFilterRequest, options: IInvitationOptions) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = filters;
    const andConditions: Prisma.InvitationWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: [
                { event: { title: { contains: searchTerm, mode: 'insensitive' } } },
                { message: { contains: searchTerm, mode: 'insensitive' } },
                { sender: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { receiver: { name: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({ AND: Object.keys(filterData).map(key => ({ [key]: (filterData as any)[key] })) });
    }

    const whereConditions: Prisma.InvitationWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const [data, total] = await Promise.all([
        prisma.invitation.findMany({
            where: whereConditions,
            skip,
            take: limit,
            orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: 'desc' },
            include: {
                sender: { select: { name: true, email: true } },
                receiver: { select: { name: true, email: true } },
                event: { select: { title: true } }
            }
        }),
        prisma.invitation.count({ where: whereConditions })
    ]);

    return { meta: { total, page, limit }, data };
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
        throw new AppError(httpStatus.FORBIDDEN, "Access denied.");
    return result;
};

const withdrawInvitation = async (userId: string, id: string) => {
    const invitation = await prisma.invitation.findUnique({ where: { id } });
    if (!invitation || invitation.senderId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Unauthorized.");

    if (invitation.status !== RequestStatus.PENDING) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot withdraw processed invitation.");
    }
    return await prisma.invitation.delete({ where: { id } });
};

const cleanupInvitations = async () => {
    return await prisma.invitation.deleteMany({
        where: {
            OR: [
                { status: RequestStatus.REJECTED },
                { status: RequestStatus.BANNED },
                { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            ]
        }
    });
};

export const InvitationService = {
    sendInvitation,
    respondToInvitation,
    getMyInvitations,
    getSentInvitations,
    getSingleInvitation,
    getAllInvitations,
    withdrawInvitation,
    cleanupInvitations
};