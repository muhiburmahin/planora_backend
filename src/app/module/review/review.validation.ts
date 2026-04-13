import { z } from 'zod';

const createReview = z.object({
    body: z.object({
        eventId: z.string().min(1, "Event ID is required"),
        rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
        comment: z.string().min(5, "Comment must be at least 5 characters long"),
    }),
});

const updateReview = z.object({
    body: z.object({
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().min(5).optional(),
    }),
});

export const ReviewValidations = {
    createReview,
    updateReview,
};