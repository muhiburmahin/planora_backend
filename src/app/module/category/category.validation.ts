import { z } from 'zod';

const createCategory = z.object({
    body: z.object({
        name: z.string().min(1, { message: 'Name is required' }),
        description: z.string().optional(),
    }),
});

const updateCategory = z.object({
    body: z.object({
        name: z.string().optional(),
        description: z.string().optional(),
    }),
});

export const CategoryValidation = {
    createCategory,
    updateCategory,
};