/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import status from "http-status";
import { ParticipationService } from "./participation.service";
import pick from "../../shared/pick";

const joinEvent = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await ParticipationService.joinEvent(user.id, req.body.eventId);
    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: "Successfully joined the event",
        data: result
    });
});

const getMyParticipations = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const filters = { userId: user.id };
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await ParticipationService.getAllParticipations(filters, options);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Personal registrations fetched",
        meta: result.meta,
        data: result.data
    });
});

const getAllParticipations = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'status', 'paymentStatus', 'eventId', 'userId']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await ParticipationService.getAllParticipations(filters, options);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "All registrations fetched",
        meta: result.meta,
        data: result.data
    });
});

const getSingleParticipation = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ParticipationService.getSingleParticipation(id as string);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Registration detail fetched",
        data: result
    });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ParticipationService.updateStatus(id as string, req.body);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Status updated",
        data: result
    });
});

const cancelParticipation = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    await ParticipationService.cancelParticipation(user.id, id as string);
    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: "Booking cancelled successfully",
        data: null
    });
});

export const ParticipationController = {
    joinEvent,
    getMyParticipations,
    getAllParticipations,
    getSingleParticipation,
    updateStatus,
    cancelParticipation
};