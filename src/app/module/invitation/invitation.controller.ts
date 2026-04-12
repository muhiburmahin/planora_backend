import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { InvitationService } from "./invitation.service";

const sendInvitation = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.sendInvitation((req as any).user.id, req.body);
    sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Invitation sent successfully", data: result });
});

const respondToInvitation = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.respondToInvitation((req as any).user.id, req.params.id, req.body.status);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Response submitted", data: result });
});

const getMyInvitations = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.getMyInvitations((req as any).user.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Inbox fetched", data: result });
});

const getSentInvitations = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.getSentInvitations((req as any).user.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Sent items fetched", data: result });
});

const getSingleInvitation = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.getSingleInvitation((req as any).user.id, req.params.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Invitation details fetched", data: result });
});

const getAllInvitations = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['searchTerm', 'status', 'eventId']);
    const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
    const result = await InvitationService.getAllInvitations(filters, options);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "All invitations fetched", meta: result.meta, data: result.data });
});

const withdrawInvitation = catchAsync(async (req: Request, res: Response) => {
    await InvitationService.withdrawInvitation((req as any).user.id, req.params.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Withdrawn successfully", data: null });
});

const cleanupInvitations = catchAsync(async (req: Request, res: Response) => {
    const result = await InvitationService.cleanupInvitations();
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "System cleanup successful", data: result });
});

export const InvitationController = {
    sendInvitation, respondToInvitation, getMyInvitations, getSentInvitations,
    getSingleInvitation, getAllInvitations, withdrawInvitation, cleanupInvitations
};