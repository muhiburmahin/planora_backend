/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Prisma, Role, EventStatus, NotificationType, EventType } from "../../../generated/prisma/client";
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

    const eventDate = new Date(payload.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    if (eventDate < today) {
        throw new AppError(httpStatus.BAD_REQUEST, "Event date cannot be in the past");
    }

    const isEventExist = await prisma.event.findFirst({
        where: {
            title: { equals: payload.title, mode: 'insensitive' },
            organizerId: payload.organizerId,
            isDeleted: false
        }
    });

    if (isEventExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "You already have an event with this title");
    }

    const slug = generateSlug(payload.title);

    const newEvent = await prisma.$transaction(async (tx) => {
        const { images, ...eventData } = payload;

        return await tx.event.create({
            data: {
                ...eventData,
                slug,
                images: imageUrls && imageUrls.length > 0 ? {
                    create: imageUrls.map((url) => ({ url }))
                } : undefined
            },
            include: { images: true, category: true },
        });
    });

    if (newEvent) {
        NotificationService.createNotification(
            newEvent.organizerId,
            `Your event "${newEvent.title}" has been created successfully!`,
            NotificationType.SYSTEM_ALERT,
            `/events/${newEvent.slug}`
        ).catch(err => console.error("Notification Error:", err));
    }

    return newEvent;
};
// 2. Advanced Filtering and Searching
const getAllEvents = async (filters: IEventFilterRequest, options: any) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const { searchTerm, categoryId, minPrice, maxPrice, status, type, ...filterData } = filters;
    const cost = (filters as any).cost;

    const skip = (Number(page) - 1) * Number(limit);
    const andConditions: Prisma.EventWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
                { venue: { contains: searchTerm, mode: 'insensitive' } }
            ],
        });
    }

    // Default to published only if not explicitly requested otherwise
    const isPublishedFilter = (filters as any).isPublished;
    if (isPublishedFilter === undefined || isPublishedFilter === null) {
        // Admin bypass — no isPublished filter, show all events
    } else {
        andConditions.push({ isPublished: isPublishedFilter === true || isPublishedFilter === 'true' });
    }

    andConditions.push({ isDeleted: false });

    // 3. Specific Filters
    if (categoryId) andConditions.push({ categoryId });
    if (status) andConditions.push({ status: status as EventStatus });
    
    if (type) andConditions.push({ type: type as EventType });

    // 5. Cost Filter (Free/Paid)
    if (cost) {
        if (cost === 'FREE') {
            andConditions.push({ registrationFee: 0 });
        } else if (cost === 'PAID') {
            andConditions.push({ registrationFee: { gt: 0 } });
        }
    }

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
            _count: { select: { participations: true } }
        },
        orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.event.count({ where: whereConditions });
    const totalPage = Math.ceil(total / Number(limit));

    return { 
        meta: { 
            page: Number(page), 
            limit: Number(limit), 
            total, 
            totalPage 
        }, 
        data: result 
    };
};

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
const updateEvent = async (id: string, user: { id: string, role: Role }, payload: Prisma.EventUpdateInput) => {
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });

    // Logic: Only Admin or the specific Organizer can update
    if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "Unauthorized: You are not the owner of this event");
    }

    // Logic: Update slug if title changes
    if (typeof payload.title === 'string' && payload.title !== event.title) {
        (payload as any).slug = generateSlug(payload.title);
    }

    // Validate and handle images
    if (payload.images && Array.isArray(payload.images)) {
        const imageList = payload.images;
        (payload as any).images = {
            deleteMany: {},
            create: imageList.map((image: any) => {
                if (typeof image === 'string') {
                    return { url: image };
                }
                return { url: image.url };
            })
        };
    }

    return await prisma.event.update({
        where: { id },
        data: payload,
        include: { images: true },
    });
};

// 5. Protected Delete Event (Soft Delete Implementation)
const deleteEvent = async (id: string, user: { id: string, role: Role }) => {
   
    const event = await prisma.event.findUniqueOrThrow({
        where: { id },
        include: {
            _count: { select: { participations: true } }
        }
    });
 if (event.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "This event is already deleted.");
    }

   if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "Unauthorized deletion attempt");
    }

    if (event._count.participations > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot delete event with active participants. Please cancel instead.");
    }

   return await prisma.event.update({
        where: { id },
        data: { 
            isDeleted: true,
            status: 'CANCELLED'
        }
    });
};

export const EventService = { createEvent, getAllEvents, getSingleEvent, updateEvent, deleteEvent };

