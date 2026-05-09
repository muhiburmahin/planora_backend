import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Testing Cloudinary with:");
console.log("- Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("- API Key:", process.env.CLOUDINARY_API_KEY);

async function testCloudinary() {
    try {
        const result = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/sample.jpg", {
            folder: "test_connection"
        });
        console.log("✅ Success! Cloudinary is working.");
        console.log("Result URL:", result.secure_url);
    } catch (error) {
        console.error("❌ Cloudinary Test Failed:");
        console.error(error);
    }
}

testCloudinary();
