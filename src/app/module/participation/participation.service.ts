/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";
import status from "http-status";
import { IParticipationFilterRequest, IParticipationOptions } from "./participation.interface";
import { NotificationService } from "../notification/notification.service";
import { NotificationType, Prisma, RequestStatus, UserStatus, EventStatus, PaymentStatus } from "../../../generated/prisma/client";

const joinEvent = async (userId: string, eventId: string): Promise<any> => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
        throw new AppError(status.FORBIDDEN, "User account is not active or found");
    }

    const event = await prisma.event.findFirst({
        where: { id: eventId, isPublished: true, status: EventStatus.UPCOMING },
        include: { _count: { select: { participations: true } } }
    });

    if (!event) throw new AppError(status.NOT_FOUND, "Event not found or not available");

    const currentTime = new Date();
    const eventDate = (event as any).date || (event as any).startDate;
    if (eventDate) {
        const deadline = new Date(new Date(eventDate).getTime() - 60 * 60 * 1000);
        if (currentTime > deadline) {
            throw new AppError(status.BAD_REQUEST, "Registration closed! Deadline was 1 hour before start.");
        }
    }

    if (event.maxParticipants && event._count.participations >= event.maxParticipants) {
        throw new AppError(status.BAD_REQUEST, "Event capacity reached!");
    }

    const result = await prisma.$transaction(async (tx) => {
        
        if (event.type === 'PRIVATE') {
            const hasInvitation = await tx.invitation.findFirst({
                where: { eventId, receiverId: userId, status: RequestStatus.APPROVED } 
            });
            
            if (!hasInvitation) {
                throw new AppError(status.FORBIDDEN, "This is a private event. You need an invitation to join.");
            }
        }

       
        const alreadyJoined = await tx.participation.findFirst({ where: { userId, eventId } });
        if (alreadyJoined) throw new AppError(status.CONFLICT, "You are already registered");

        const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const isFree = event.registrationFee === 0;

        return await tx.participation.create({
            data: {
                userId,
                eventId,
                ticketNumber,
                status: isFree ? RequestStatus.APPROVED : RequestStatus.PENDING,
            },
            include: { event: { select: { title: true, id: true } } }
        });
    }, {
        timeout: 20000
    });

    if (result && result.event) { 
        try {
            await NotificationService.createNotification(
                userId,
                `You have successfully joined: ${result.event.title}`,
                NotificationType.REGISTRATION_CONFIRMED,
                `/events/${result.eventId}`
            );
        } catch (error) {
            console.error(`\x1b[31m[Notification-Failed]\x1b[0m`, error);
        }
    }

    return result;
};

const getAllParticipations = async (filters: IParticipationFilterRequest, options: IParticipationOptions) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (Number(page) - 1) * Number(limit);
    const { searchTerm, ...filterData } = filters;

    const andConditions: Prisma.ParticipationWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: [
                { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
                { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                { event: { title: { contains: searchTerm, mode: 'insensitive' } } }
            ]
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => ({ [key]: (filterData as any)[key] }))
        });
    }

    const whereConditions: Prisma.ParticipationWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.participation.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
            user: { select: { name: true, email: true, image: true } },
            event: { select: { title: true, date: true, venue: true, registrationFee: true } },
            payments: true
        }
    });

    const total = await prisma.participation.count({ where: whereConditions });
    return { meta: { page: Number(page), limit: Number(limit), total }, data: result };
};

const getMyParticipations = async (userId: string, options: IParticipationOptions) => {
    return await getAllParticipations({ userId }, options);
};

const getSingleParticipation = async (id: string) => {
    return await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { user: true, event: true, payments: true }
    });
};

const getEventParticipants = async (eventId: string, userId: string, role: string) => {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { organizerId: true }
    });

    if (!event) {
        throw new AppError(status.NOT_FOUND, "Event not found");
    }

    if (role !== 'ADMIN' && event.organizerId !== userId) {
        throw new AppError(status.FORBIDDEN, "You are not authorized to view this event's participants");
    }

    const participants = await prisma.participation.findMany({
        where: { eventId },
        include: { 
            user: { select: { name: true, email: true, image: true } },
            payments: true 
        },
        orderBy: { createdAt: 'desc' }
    });

    return participants;
};

const updateStatus = async (id: string, payload: any) => { 
    const { status: updatedStatus } = payload;

    const currentRecord = await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { event: true, payments: true }
    });

    if (updatedStatus === RequestStatus.APPROVED && currentRecord.event.registrationFee > 0) {
        const isPaid = currentRecord.payments.some(p => p.paymentStatus === PaymentStatus.PAID);
        if (!isPaid) {
            throw new AppError(status.BAD_REQUEST, "Cannot approve registration without confirmed payment.");
        }
    }

    const result = await prisma.participation.update({
        where: { id },
        data: {
            status: updatedStatus,
        },
        include: { event: true, user: true }
    });

    if (result && updatedStatus) {
        await NotificationService.createNotification(
            result.userId,
            `Your registration for ${result.event.title} is now ${updatedStatus}.`,
            NotificationType.SYSTEM_ALERT,
            `/participations/${result.id}`
        );
    }

    return result;
};

const cancelParticipation = async (userId: string, id: string) => {
    const participation = await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { event: true, payments: true }
    });

    if (participation.userId !== userId) {
        throw new AppError(status.FORBIDDEN, "Unauthorized access");
    }

    const isPaid = participation.payments.some(p => p.paymentStatus === PaymentStatus.PAID);
    if (isPaid) {
        throw new AppError(status.BAD_REQUEST, "Paid registrations cannot be deleted.");
    }

    const eventDate = (participation.event as any).date || (participation.event as any).startDate;
    if (eventDate) {
        const diff = (new Date(eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
        if (diff < 24) {
            throw new AppError(status.BAD_REQUEST, "Cancellations allowed only 24 hours before start.");
        }
    }

    return await prisma.participation.delete({ where: { id } });
};

export const ParticipationService = {
    joinEvent,
    getMyParticipations,
    getAllParticipations,
    getSingleParticipation,
    getEventParticipants,
    updateStatus,
    cancelParticipation
};