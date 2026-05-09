import { z } from "zod";
import { EventStatus, EventType } from "../../../generated/prisma";

const createEvent = z.object({
    body: z.object({
        title: z.string().min(1, "Title is required"),
        shortDescription: z.string().max(255).optional(),
        description: z.string().min(1, "Description is required"),
        date: z.string().min(1, "Date is required"),
        time: z.string().min(1, "Time is required"),
        venue: z.string().min(1, "Venue is required"),
        categoryId: z.string().min(1, "Category ID is required"),

        registrationFee: z.coerce.number().min(0).optional(),
        maxParticipants: z.coerce.number().int().min(1).optional(),

        isOnline: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
        isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),

        type: z.nativeEnum(EventType).optional(),
        status: z.nativeEnum(EventStatus).optional(),
    }),
});

const updateEvent = z.object({
    body: z.object({
        title: z.string().optional(),
        shortDescription: z.string().max(255).optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        venue: z.string().optional(),
        categoryId: z.string().optional(),
        registrationFee: z.coerce.number().optional(),
        maxParticipants: z.coerce.number().int().min(1).optional(),
        isOnline: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
        isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
        type: z.nativeEnum(EventType).optional(),
        status: z.nativeEnum(EventStatus).optional(),
        isPublished: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
    }),
});

export const EventValidations = { createEvent, updateEvent };