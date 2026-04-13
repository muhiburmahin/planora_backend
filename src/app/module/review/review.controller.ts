/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ReviewService } from './review.service';
import pick from '../../shared/pick';

// 1. Create a new review
const createReview = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await ReviewService.createReview(user.id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Review submitted successfully!',
        data: result,
    });
});

// 2. Get all reviews for a specific event
const getEventReviews = catchAsync(async (req, res) => {
    const { eventId } = req.params;
    const options = pick(req.query, ['page', 'limit']);
    const result = await ReviewService.getEventReviews(eventId as string, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Event reviews fetched successfully',
        meta: result.meta,
        data: result.data,
    });
});

// 3. Get review statistics (Average rating & Total counts)
const getReviewStats = catchAsync(async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const result = await ReviewService.getReviewStats(eventId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review statistics fetched successfully',
        data: result,
    });
});

const getMyReviews = catchAsync(async (req, res) => {
    const user = (req as any).user;

    const options = {
        page: req.query.page,
        limit: req.query.limit
    };

    const result = await ReviewService.getMyReviews(user.id, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'My reviews fetched successfully!',
        meta: result.meta,
        data: result.data,
    });
});

// 5. Update an existing review
const updateReview = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    const result = await ReviewService.updateReview(user.id, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review updated successfully',
        data: result,
    });
});

// 6. Delete a review (User specific)
const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { id } = req.params;
    await ReviewService.deleteReview(user.id, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review deleted successfully',
        data: null,
    });
});

// 7. Delete any review (Admin only)
const deleteReviewByAdmin = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ReviewService.deleteReviewByAdmin(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Review removed by Admin successfully',
        data: null,
    });
});

export const ReviewController = {
    createReview,
    getEventReviews,
    getReviewStats,
    getMyReviews,
    updateReview,
    deleteReview,
    deleteReviewByAdmin
};