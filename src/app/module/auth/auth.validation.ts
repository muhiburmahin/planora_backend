import { z } from 'zod';

const registerValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters"),

        email: z.string().min(1, "Email is required").email("Invalid email address"),

        password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),

        image: z.string().url("Invalid image URL").optional(),
    }),
});

const loginValidationSchema = z.object({
    body: z.object({
        email: z.string().min(1, "Email is required").email("Invalid email address"),

        password: z.string().min(1, "Password is required"),
    }),
});

export const AuthValidation = {
    registerValidationSchema,
    loginValidationSchema
};