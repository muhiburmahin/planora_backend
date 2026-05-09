import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const envVars = {
    NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
    PORT: (process.env.PORT || '5000').trim(),
    DATABASE_URL: process.env.DATABASE_URL?.trim(),
    BCRYPT_SALT_ROUNDS: (process.env.BCRYPT_SALT_ROUNDS || '12').trim(),

    // JWT Config
    JWT_ACCESS_SECRET: process.env.ACCESS_TOKEN_SECRET?.trim(),
    JWT_ACCESS_EXPIRES_IN: (process.env.ACCESS_TOKEN_EXPIRES_IN || '1h').trim(),
    JWT_REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET?.trim(),
    JWT_REFRESH_EXPIRES_IN: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d').trim(),

    // Better Auth & URLs
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET?.trim(),
    BETTER_AUTH_URL: (process.env.BETTER_AUTH_URL || 'http://localhost:5000/api/v1/auth').trim(),
    FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:3000').trim(),
    BACKEND_URL: (process.env.BACKEND_URL || 'http://localhost:5000').trim(),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY?.trim(),
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET?.trim(),

    // Email Config
    EMAIL_USER: process.env.EMAIL_USER?.trim(),
    EMAIL_PASS: process.env.EMAIL_PASS?.trim(),
    EMAIL_SENDER_SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST?.trim(),
    EMAIL_SENDER_SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT?.trim(),
    EMAIL_SENDER_SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM?.trim(),

    // Social Login (Google)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim(),
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL?.trim(),

    // Stripe Config
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
};

// Safety Checks
if (!envVars.JWT_ACCESS_SECRET) {
    console.error("❌ ERROR: JWT_ACCESS_SECRET is missing in .env file!");
}
if (!envVars.CLOUDINARY_CLOUD_NAME || !envVars.CLOUDINARY_API_KEY || !envVars.CLOUDINARY_API_SECRET) {
    console.error("❌ ERROR: Cloudinary configuration is incomplete in .env file!");
}
if (!envVars.GOOGLE_CLIENT_ID) {
    console.warn("⚠️ WARNING: GOOGLE_CLIENT_ID is missing for Social Login!");
}