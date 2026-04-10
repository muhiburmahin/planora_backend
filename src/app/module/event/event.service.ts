/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Prisma, Role } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { IEvent, IEventFilterRequest } from "./event.interface";
import AppError from "../../errorHelpers/appError";

const createEvent = async (payload: IEvent, imageUrls: string[]) => {
    const isEventExist = await prisma.event.findFirst({
        where: {
            title: payload.title,
            organizerId: payload.organizerId
        }
    });

    if (isEventExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "You have already created an event with this title!");
    }

    return await prisma.$transaction(async (tx) => {
        return await tx.event.create({
            data: {
                ...payload,
                images: { create: imageUrls.map((url) => ({ url })) },
            },
            include: { images: true, category: true },
        });
    });
};

const getAllEvents = async (filters: IEventFilterRequest, options: any) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { searchTerm, categoryId, minPrice, maxPrice, ...filterData } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const andConditions: Prisma.EventWhereInput[] = [];


    if (searchTerm) {
        andConditions.push({
            OR: ['title', 'description', 'venue'].map((field) => ({
                [field]: { contains: searchTerm, mode: 'insensitive' },
            })),
        });
    }

    if (categoryId) andConditions.push({ categoryId });

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
        include: { images: true, category: true, organizer: { select: { name: true, image: true } } },
        orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.event.count({ where: whereConditions });
    const totalPage = Math.ceil(total / Number(limit));

    return { meta: { page: Number(page), limit: Number(limit), total, totalPage }, data: result };
};

const getSingleEvent = async (id: string) => {
    return await prisma.event.findUniqueOrThrow({
        where: { id },
        include: {
            images: true,
            category: true,
            organizer: { select: { id: true, name: true, image: true, email: true } },
            reviews: { include: { user: { select: { name: true, image: true } } } },
            _count: { select: { participations: true } }
        },
    });
};

const updateEvent = async (id: string, user: { id: string, role: Role }, payload: Partial<IEvent>) => {
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });

    if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to update this event!");
    }

    return await prisma.event.update({
        where: { id },
        data: payload,
        include: { images: true },
    });
};

const deleteEvent = async (id: string, user: { id: string, role: Role }) => {
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });

    if (user.role !== Role.ADMIN && event.organizerId !== user.id) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not allowed to delete this event!");
    }

    return await prisma.event.delete({ where: { id } });
};

export const EventService = { createEvent, getAllEvents, getSingleEvent, updateEvent, deleteEvent };