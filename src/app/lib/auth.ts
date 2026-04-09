import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
            },
            status: {
                type: "string",
                defaultValue: "ACTIVE",
            },
            isDeleted: {
                type: "boolean",
                defaultValue: false,
            },
            needPasswordChange: {
                type: "boolean",
                defaultValue: false,
            }
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    }
});