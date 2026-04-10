/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { EventService } from "./event.service";
import pick from "../../shared/pick";

const createEvent = catchAsync(async (req: Request, res: Response) => {
    // ইন্ডাস্ট্রি স্ট্যান্ডার্ড স্লাগ জেনারেশন
    const slug = req.body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const imageUrls = (req.files as any[])?.map((file) => file.path) || [];

    const result = await EventService.createEvent(
        {
            ...req.body,
            slug,
            organizerId: req.user.id,
            date: new Date(req.body.date),
            registrationFee: Number(req.body.registrationFee) || 0
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
    const filters = pick(req.query, ['searchTerm', 'categoryId', 'type', 'status', 'minPrice', 'maxPrice', 'isOnline']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

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

    const result = await EventService.updateEvent(id as string, req.user as any, req.body);

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