import { z } from "zod";

const createParticipation = z.object({
    body: z.object({
        eventId: z
            .string()
            .uuid("Invalid Event ID format")
            .min(1, "Event ID is required"),
    }),
});

const updateStatus = z.object({
    body: z.object({
        status: z
            .enum(["PENDING", "APPROVED", "REJECTED", "BANNED"], {
                message: "Invalid status value",
            })
            .optional(),
        paymentStatus: z
            .enum(["PENDING", "PAID", "FAILED", "REFUNDED"], {
                message: "Invalid payment status value",
            })
            .optional(),
    }),
});

export const ParticipationValidations = {
    createParticipation,
    updateStatus,
};