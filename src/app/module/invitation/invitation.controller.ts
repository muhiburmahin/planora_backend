/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { InvitationService } from "./invitation.service";

const sendInvitation = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    const result = await InvitationService.sendInvitation(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Invitation sent successfully",
        data: result
    });
});

const respondToInvitation = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;

    const result = await InvitationService.respondToInvitation(userId, id as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Invitation ${status.toLowerCase()} successfully`,
        data: result
    });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    const result = await InvitationService.getMyInvitations(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inbox invitations retrieved successfully",
        data: result
    });
});

const getSentInvitations = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    const result = await InvitationService.getSentInvitations(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Sent invitations retrieved successfully",
        data: result
    });
});

const getSingleInvitation = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    const result = await InvitationService.getSingleInvitation(userId, req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invitation details retrieved successfully",
        data: result
    });
});

const getAllInvitations = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'status', 'eventId', 'senderId', 'receiverId']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

    const result = await InvitationService.getAllInvitations(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All invitations retrieved successfully",
        meta: result.meta,
        data: result.data
    });
});

const withdrawInvitation = catchAsync(async (req: Request, res: Response) => {
    const { id: userId } = (req as any).user;
    await InvitationService.withdrawInvitation(userId, req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Invitation withdrawn successfully",
        data: null
    });
});

const cleanupInvitations = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.cleanupInvitations();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System cleanup performed successfully",
        data: result
    });
});

export const InvitationController = {
    sendInvitation,
    respondToInvitation,
    getMyInvitations,
    getSentInvitations,
    getSingleInvitation,
    getAllInvitations,
    withdrawInvitation,
    cleanupInvitations
};