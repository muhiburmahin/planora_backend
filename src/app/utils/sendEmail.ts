import nodemailer from "nodemailer";
import { envVars } from "../config/env";

export const sendEmail = async (to: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: envVars.EMAIL_USER,
            pass: envVars.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    await transporter.sendMail({
        from: `"Planora Support" <${envVars.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};