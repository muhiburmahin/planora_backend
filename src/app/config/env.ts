import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '5000',
    DATABASE_URL: process.env.DATABASE_URL,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || '12',

    JWT_ACCESS_SECRET: process.env.ACCESS_TOKEN_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h',
    JWT_REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

if (!envVars.JWT_ACCESS_SECRET) {
    console.error("❌ ERROR: JWT_ACCESS_SECRET is missing in .env file!");
}