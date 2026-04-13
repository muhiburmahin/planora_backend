/* eslint-disable @typescript-eslint/no-explicit-any */
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary.config';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: any, file: any) => {

        const uniqueFileName = `${file.fieldname}-${uuidv4()}`;

        return {
            folder: 'planora_uploads',
            public_id: uniqueFileName,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        };
    },
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!') as any, false);
        }
    }
});