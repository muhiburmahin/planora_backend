import { z } from 'zod';
import { UserStatus } from '../../../generated/prisma/client';

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        image: z.string().url().optional(),
        bio: z.string().max(500).optional(),
        contactNumber: z.string().optional(),
        address: z.string().optional(),
    }),
});

const getDashboardStatsSchema = z.object({
    query: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }),
});

const updateStatusSchema = z.object({
    body: z.object({
        status: z.enum(
            Object.values(UserStatus) as [string, ...string[]],
            {
                message: "Status must be ACTIVE, BLOCKED, DELETED, or PENDING"
            }
        ),
    }),
});


export const UserValidation = {
    updateProfileSchema,
    getDashboardStatsSchema,
    updateStatusSchema
};