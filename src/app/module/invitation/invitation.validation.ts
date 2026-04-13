import { z } from 'zod';

const sendInvitation = z.object({
    body: z.object({
        eventId: z.string().min(1, "Event ID is required"),
        receiverId: z.string().min(1, "Receiver ID is required"),
        message: z.string().optional(),
    }),
});

const respondToInvitation = z.object({
    body: z.object({
        status: z.enum(["APPROVED", "REJECTED"], {
            message: "Status must be either APPROVED or REJECTED"
        }),
    }),
});

export const InvitationValidations = {
    sendInvitation,
    respondToInvitation,
};