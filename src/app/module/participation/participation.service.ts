/* eslint-disable @typescript-eslint/no-explicit-any */
import { Participation, Prisma, RequestStatus, PaymentStatus, UserStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";
import status from "http-status";
import { IParticipationFilterRequest, IParticipationOptions } from "./participation.interface";

// 1. Join Event with Advanced Validation
const joinEvent = async (userId: string, eventId: string): Promise<Participation> => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.status !== UserStatus.ACTIVE) {
            throw new AppError(status.FORBIDDEN, "User account is not active or found");
        }

        const event = await tx.event.findFirst({
            where: {
                id: eventId,
                isPublished: true,
                status: "UPCOMING"
            },
            include: { _count: { select: { participations: true } } }
        });

        if (!event) throw new AppError(status.NOT_FOUND, "Event not found or not available for registration");

        const currentTime = new Date();
        const eventDate = (event as any).date || (event as any).startDate;
        if (eventDate) {
            const deadline = new Date(new Date(eventDate).getTime() - 60 * 60 * 1000);
            if (currentTime > deadline) {
                throw new AppError(status.BAD_REQUEST, "Registration closed! Deadline was 1 hour before start.");
            }
        }

        if (event.maxParticipants && event._count.participations >= event.maxParticipants) {
            throw new AppError(status.BAD_REQUEST, "Event capacity reached! Better luck next time.");
        }

        const alreadyJoined = await tx.participation.findFirst({ where: { userId, eventId } });
        if (alreadyJoined) throw new AppError(status.CONFLICT, "You are already registered for this event");

        const ticketNumber = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const isFree = event.registrationFee === 0;

        return await tx.participation.create({
            data: {
                userId,
                eventId,
                ticketNumber,
                status: isFree ? RequestStatus.APPROVED : RequestStatus.PENDING,
                paymentStatus: isFree ? PaymentStatus.PAID : PaymentStatus.PENDING,
            },
            include: { event: true }
        });
    }, { timeout: 15000 });
};

// 2. Advanced Filtering & Searching
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
            // FIX: 'location' এর বদলে 'venue' ব্যবহার করা হয়েছে আপনার স্কিমা অনুযায়ী
            event: { select: { title: true, date: true, venue: true, registrationFee: true } }
        }
    });

    const total = await prisma.participation.count({ where: whereConditions });
    return { meta: { page: Number(page), limit: Number(limit), total }, data: result };
};

// 3. Get My Participations
const getMyParticipations = async (userId: string, options: IParticipationOptions) => {
    return await getAllParticipations({ userId }, options);
};

// 4. Get Single Participation Details
const getSingleParticipation = async (id: string) => {
    return await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { user: true, event: true }
    });
};

// 5. Update Status with Business Rules
const updateStatus = async (id: string, payload: Partial<Participation>) => {
    const { status: updatedStatus, paymentStatus, transactionId, paymentDetails } = payload;

    const currentRecord = await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { event: true }
    });

    if (updatedStatus === RequestStatus.APPROVED && currentRecord.event.registrationFee > 0) {
        if (paymentStatus !== PaymentStatus.PAID && currentRecord.paymentStatus !== PaymentStatus.PAID) {
            throw new AppError(status.BAD_REQUEST, "Cannot approve registration without confirmed payment.");
        }
    }

    return await prisma.participation.update({
        where: { id },
        data: {
            status: updatedStatus,
            paymentStatus,
            transactionId,
            paymentDetails: paymentDetails as Prisma.InputJsonValue
        },
        include: { event: true, user: true }
    });
};

// 6. Safe Cancel Registration
const cancelParticipation = async (userId: string, id: string) => {
    const participation = await prisma.participation.findUniqueOrThrow({
        where: { id },
        include: { event: true }
    });

    if (participation.userId !== userId) {
        throw new AppError(status.FORBIDDEN, "Unauthorized access");
    }

    if (participation.paymentStatus === PaymentStatus.PAID) {
        throw new AppError(status.BAD_REQUEST, "Paid registrations cannot be deleted. Contact support.");
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
    updateStatus,
    cancelParticipation
};