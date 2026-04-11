import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { envVars } from "../config/env";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    baseURL: `${envVars.BACKEND_URL}/api/v1/auth`,

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },

    socialProviders: {
        google: {
            clientId: envVars.GOOGLE_CLIENT_ID as string,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,
        },
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
            },
            verificationToken: {
                type: "string",
                required: false,
                defaultValue: "",
            }
        }
    },

    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60
        }
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await prisma.profile.create({
                        data: {
                            userId: user.id,
                            bio: "",
                            contactNumber: "",
                            address: ""
                        }
                    });
                }
            }
        }
    },

});