/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary.config';

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'planora_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    } as any,
});

// Multer upload middleware
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB size limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Clean error handling for non-image files
            cb(new Error('Only images are allowed!'));
        }
    }
});