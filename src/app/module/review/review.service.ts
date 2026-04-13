/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/appError';
import httpStatus from 'http-status';
import { IReviewPayload, IReviewUpdatePayload } from './review.interface';


const updateEventStats = async (tx: any, eventId: string) => {
    const stats = await tx.review.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { id: true }
    });

    await tx.event.update({
        where: { id: eventId },
        data: {
            averageRating: stats._avg.rating || 0,
            totalReviews: stats._count.id
        }
    });
};

const createReview = async (userId: string, payload: IReviewPayload) => {
    return await prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
            where: { id: payload.eventId },
            select: { organizerId: true, status: true, date: true }
        });

        if (!event) throw new AppError(httpStatus.NOT_FOUND, "Event not found.");

        const alreadyReviewed = await tx.review.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId: payload.eventId
                }
            }
        });
        if (alreadyReviewed) {
            throw new AppError(httpStatus.BAD_REQUEST, "You have already reviewed this event.");
        }

        if (event.organizerId === userId) {
            throw new AppError(httpStatus.BAD_REQUEST, "Hosts cannot review their own events.");
        }

        const isParticipant = await tx.participation.findFirst({
            where: { eventId: payload.eventId, userId, status: 'APPROVED' }
        });
        if (!isParticipant) throw new AppError(httpStatus.FORBIDDEN, "Only approved participants can review.");

        const isEnded = event.status === 'COMPLETED' || new Date(event.date) < new Date();
        if (!isEnded) {
            throw new AppError(httpStatus.BAD_REQUEST, "Reviews are allowed only after the event ends.");
        }

        const review = await tx.review.create({
            data: { userId, ...payload },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        email: true
                    }
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                        venue: true,
                        organizer: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        await updateEventStats(tx, payload.eventId);
        return review;
    }, {
        maxWait: 10000,
        timeout: 20000
    });
};

const getEventReviews = async (eventId: string, options: any) => {
    const { page = 1, limit = 10 } = options;
    const skip = (Number(page) - 1) * Number(limit);

    const result = await prisma.review.findMany({
        where: { eventId },
        skip,
        take: Number(limit),
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.review.count({ where: { eventId } });

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit))
        },
        data: result
    };
};

const getReviewStats = async (eventId: string) => {
    const stats = await prisma.review.aggregate({
        where: { eventId },
        _avg: { rating: true },
        _count: { id: true }
    });

    return {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id
    };
};

const getMyReviews = async (userId: string, options: any) => {
    const { page = 1, limit = 10 } = options;
    const skip = (Number(page) - 1) * Number(limit);

    const result = await prisma.review.findMany({
        where: { userId },
        skip,
        take: Number(limit),
        include: {
            event: {
                select: { title: true, id: true, date: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.review.count({ where: { userId } });

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit))
        },
        data: result
    };
};

const updateReview = async (userId: string, reviewId: string, payload: IReviewUpdatePayload) => {
    return await prisma.$transaction(async (tx) => {
        const review = await tx.review.findUnique({ where: { id: reviewId } });

        if (!review) throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
        if (review.userId !== userId) throw new AppError(httpStatus.FORBIDDEN, "You can only update your own review.");

        const result = await tx.review.update({
            where: { id: reviewId },
            data: payload
        });

        if (payload.rating) {
            await updateEventStats(tx, review.eventId);
        }

        return result;
    });
};

const deleteReview = async (userId: string, reviewId: string) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError(httpStatus.NOT_FOUND, "Review not found.");

    if (review.userId !== userId) throw new AppError(httpStatus.FORBIDDEN, "Unauthorized deletion.");

    const diff = Date.now() - new Date(review.createdAt).getTime();
    if (diff > 7 * 24 * 60 * 60 * 1000) {
        throw new AppError(httpStatus.BAD_REQUEST, "Deletion period (7 days) has expired.");
    }

    return await prisma.$transaction(async (tx) => {
        const deletedReview = await tx.review.delete({ where: { id: reviewId } });
        await updateEventStats(tx, review.eventId);
        return deletedReview;
    });
};

const deleteReviewByAdmin = async (reviewId: string) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError(httpStatus.NOT_FOUND, "Review not found.");

    return await prisma.$transaction(async (tx) => {
        const deletedReview = await tx.review.delete({ where: { id: reviewId } });
        await updateEventStats(tx, review.eventId);
        return deletedReview;
    });
};

export const ReviewService = {
    createReview,
    getEventReviews,
    getReviewStats,
    getMyReviews,
    updateReview,
    deleteReview,
    deleteReviewByAdmin
};