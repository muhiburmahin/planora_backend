import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { envVars } from "../config/env";
import { Role, UserStatus } from "../../generated/prisma";

export const auth = betterAuth({
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    baseURL: `${envVars.BACKEND_URL}/api/auth`,

    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },

    socialProviders: {
        google: {
            clientId: envVars.GOOGLE_CLIENT_ID as string,
            clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,

            mapProfileToUser: (profile) => {
                return {
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    role: Role.USER,
                    status: UserStatus.ACTIVE,
                    needPasswordChange: false,
                    emailVerified: true,
                    isDeleted: false,
                    deletedAt: null,
                }
            }
        }
    },

    emailVerification: {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
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

    redirectURLs: {
        signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
    },

    trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:5000", envVars.FRONTEND_URL],

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

    advanced: {
        debug: true,
        useSecureCookies: false,
        cookies: {
            state: {
                attributes: {
                    sameSite: "lax",
                    secure: false,
                    httpOnly: true,
                    path: "/",
                }
            },
            sessionToken: {
                attributes: {
                    sameSite: "lax",
                    secure: false,
                    httpOnly: true,
                    path: "/",
                }
            }
        }
    }
});