import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { envVars } from '../config/env';

cloudinary.config({
    cloud_name: envVars.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'planora_events',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        };
    },
});

export const upload = multer({ storage: storage });

export const CloudinaryUtils = {
    cloudinary
};