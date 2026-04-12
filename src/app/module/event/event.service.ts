/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Prisma, Role, EventStatus, NotificationType } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { IEvent, IEventFilterRequest } from "./event.interface";
import AppError from "../../errorHelpers/appError";
import { NotificationService } from "../notification/notification.service";

const generateSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '') + '-' + Date.now();
};
// 1. Create Event with Business Logic
const createEvent = async (payload: IEvent, imageUrls: string[]) => {
    // ইভেন্ট ডেট চেক
    if (new Date(payload.date) < new Date()) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event date cannot be in the past");
    }

    // ইউনিক টাইটেল চেক
    const isEventExist = await prisma.event.findFirst({
        where: {
            title: payload.title,
            organizerId: payload.organizerId
        }
    });

    if (isEventExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "You already have an event with this title");
    }

    const slug = generateSlug(payload.title);

    // --- ট্রানজাকশন শুরু (শুধুমাত্র ডাটাবেস অপারেশন) ---
    const newEvent = await prisma.$transaction(async (tx) => {
        return await tx.event.create({
            data: {
                ...payload,
                slug,
                images: {
                    create: imageUrls.length > 0
                        ? imageUrls.map((url) => ({ url }))
                        : []
                },
            },
            include: { images: true, category: true },
        });
    });

    // --- ট্রানজাকশনের বাইরে নোটিফিকেশন পাঠানো (এটি ফিক্স) ---
    if (newEvent) {
        try {
            // এটি ট্রানজাকশনের বাইরে থাকায় এখন আর টাইমআউট এরর হবে না
            await NotificationService.createNotification(
                newEvent.organizerId,
                `আপনার ইভেন্ট "${newEvent.title}" সফলভাবে তৈরি হয়েছে!`,
                NotificationType.SYSTEM_ALERT,
                `/events/${newEvent.slug}`
            );
            console.log(`\x1b[32m[Event-Notification-Sent]\x1b[0m Notification sent to organizer.`);
        } catch (error) {
            // নোটিফিকেশন ফেইল করলেও ইভেন্ট ক্রিয়েট হয়ে গেছে, তাই ইউজারকে এরর দেখানোর দরকার নেই
            console.error(`\x1b[31m[Event-Notification-Error]\x1b[0m`, error);
        }
    }

    return newEvent;
};
// 2. Advanced Filtering and Searching
const getAllEvents = async (filters: IEventFilterRequest, options: any) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { searchTerm, categoryId, minPrice, maxPrice, status, ...filterData } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const andConditions: Prisma.EventWhereInput[] = [];

    // Search Logic: Multiple field searching
    if (searchTerm) {
        andConditions.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { venue: { contains: searchTerm, mode: 'insensitive' } }
            ],
        });
    }

    // Filter Logic: Public visibility and status
    andConditions.push({ isPublished: true });

    if (categoryId) andConditions.push({ categoryId });
    if (status) andConditions.push({ status: status as EventStatus });

    // Price Range Logic
    if (minPrice || maxPrice) {
        andConditions.push({
            registrationFee: {
                gte: minPrice ? Number(minPrice) : undefined,
                lte: maxPrice ? Number(maxPrice) : undefined,
            },
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: (filterData as any)[key],
            })),
        });
    }

    const whereConditions: Prisma.EventWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.event.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        include: {
            images: true,
            category: true,
            organizer: { select: { name: true, image: true } },
            _count: { select: { participations: true } } // For "Popularity" badges on UI
        },
        orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.event.count({ where: whereConditions });
    const totalPage = Math.ceil(total / Number(limit));

    return { meta: { page: Number(page), limit: Number(limit), total, totalPage }, data: result };
};

// 3. Get Single Event (Supports ID or Slug for SEO)
const getSingleEvent = async (identifier: string) => {
    return await prisma.event.findFirstOrThrow({
        where: {
            OR: [
                { id: identifier },
                { slug: identifier }
            ]
        },
        include: {
            images: true,
            category: true,
            organizer: { select: { id: true, name: true, image: true, email: true } },
            reviews: {
                include: { user: { select: { name: true, image: true } } },
                orderBy: { createdAt: 'desc' }
            },
            _count: { select: { participations: true } }
        },
    });
};

// 4. Update Event with Authorization
const updateEvent = async (id: string, user: { id: string, role: Role }, payload: Partial<IEvent>) => {
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });

    // Logic: Only Admin or the specific Organizer can update
    if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "Unauthorized: You are not the owner of this event");
    }

    // Logic: Update slug if title changes
    if (payload.title && payload.title !== event.title) {
        (payload as any).slug = generateSlug(payload.title);
    }

    return await prisma.event.update({
        where: { id },
        data: payload,
        include: { images: true },
    });
};

// 5. Protected Delete Event
const deleteEvent = async (id: string, user: { id: string, role: Role }) => {
    const event = await prisma.event.findUniqueOrThrow({
        where: { id },
        include: { _count: { select: { participations: true } } }
    });

    if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "Unauthorized deletion attempt");
    }

    if (event._count.participations > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot delete event with active participants. Please cancel instead.");
    }

    return await prisma.event.delete({ where: { id } });
};

export const EventService = { createEvent, getAllEvents, getSingleEvent, updateEvent, deleteEvent };