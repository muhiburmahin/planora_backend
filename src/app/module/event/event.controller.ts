/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { EventService } from "./event.service";
import pick from "../../shared/pick";

const parseBoolean = (value: unknown, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
    }
    return fallback;
};

const createEvent = catchAsync(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const imageUrls = files?.map((file) => file.path) || [];

    const result = await EventService.createEvent(
        {
            ...req.body,
            organizerId: req.user.id,
            date: new Date(req.body.date),
            registrationFee: Number(req.body.registrationFee) || 0,
            maxParticipants: req.body.maxParticipants ? Number(req.body.maxParticipants) : undefined,
            isOnline: parseBoolean(req.body.isOnline, false),
            isFeatured: parseBoolean(req.body.isFeatured, false),
        },
        imageUrls
    );

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Event created successfully!",
        data: result,
    });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
    
    const filters = pick(req.query, [
        'searchTerm', 
        'categoryId', 
        'type', 
        'status', 
        'minPrice', 
        'maxPrice', 
        'isOnline', 
        'cost',
        'isPublished'
    ]);
    
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Admins see all events (published + draft); regular users/public see only published
    const isAdmin = (req as any).user?.role === 'ADMIN';
    if (isAdmin) {
        (filters as any).isPublished = undefined; // bypass default published filter
    }

    const result = await EventService.getAllEvents(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Events fetched successfully!",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
    const result = await EventService.getSingleEvent(req.params.id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event fetched successfully!",
        data: result,
    });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const imageUrls = files?.map((file) => file.path) || [];

    const payload = {
        ...req.body,
        ...(imageUrls.length > 0 ? { images: imageUrls } : {}),
        ...(req.body.date !== undefined
            ? { date: new Date(req.body.date) }
            : {}),
        ...(req.body.registrationFee !== undefined
            ? { registrationFee: Number(req.body.registrationFee) || 0 }
            : {}),
        ...(req.body.maxParticipants !== undefined
            ? { maxParticipants: Number(req.body.maxParticipants) || undefined }
            : {}),
        ...(req.body.isPublished !== undefined
            ? { isPublished: parseBoolean(req.body.isPublished, true) }
            : {}),
        ...(req.body.isOnline !== undefined
            ? { isOnline: parseBoolean(req.body.isOnline, false) }
            : {}),
        ...(req.body.isFeatured !== undefined
            ? { isFeatured: parseBoolean(req.body.isFeatured, false) }
            : {}),
    };

    const result = await EventService.updateEvent(id as string, req.user as any, payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event updated successfully!",
        data: result,
    });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await EventService.deleteEvent(id as string, req.user as any);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Event deleted successfully!",
        data: null,
    });
});

export const EventController = { createEvent, getAllEvents, getSingleEvent, updateEvent, deleteEvent };