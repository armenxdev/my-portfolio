import nodemailer from 'nodemailer';
import 'dotenv/config';
import {buildOtpHtml, buildPasswordResetHtml} from './email.template.js';
import { logger } from '../../utils/logger';

let transporter: nodemailer.Transporter | undefined;

const getTransporter = (): nodemailer.Transporter => {
    if (transporter) return transporter;

    // Անվտանգության ստուգում environment փոփոխականների համար
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_HOST) {
        throw new Error("❌ SMTP credentials are not defined in environmental variables!");
    }

    const port = Number(process.env.SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // Եթե պորտը 465 է, secure-ը ավտոմատ դառնում է true (SSL)
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    return transporter;
};


/**
 * Send OTP email to user
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 * @throws Error if email or OTP is invalid, or if SMTP fails
 */
export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    if (!email || !otp) {
        throw new Error('Invalid email or OTP');
    }

    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM || "Armen | Backend Developer <armenbichakhchyan.dev@gmail.com>",
            to: email,
            subject: 'Your sign-in code',
            html: buildOtpHtml(Number(otp)),
            text: `Your sign-in code: ${otp}. Expires in 3 minutes.`,
        });
        logger.info(`📧 OTP email sent successfully to ${email}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to send OTP email to ' + email + ': ' + errorMessage);
        // Re-throw to let the caller handle it
        throw new Error('Failed to send verification email. Please try again.');
    }
};

export const sendResetPasswordEmail = async (email: string, resetCode: string): Promise<void> => {
    if (!email || !resetCode) {
        throw new Error('Invalid email or OTP');
    }

    try {
        await getTransporter().sendMail({
            from: process.env.SMTP_FROM || "Armen | Backend Developer <armenbichakhchyan.dev@gmail.com>",
            to: email,
            subject: 'Your password reset code',
            html: buildPasswordResetHtml(Number(resetCode)),
            text: `Your sign-in code: ${resetCode}. Expires in 15 minutes.`,
        });
        logger.info(`📧 OTP email sent successfully to ${email}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to send reset code email to ' + email + ': ' + errorMessage);
        // Re-throw to let the caller handle it
        throw new Error('Failed to send verification email. Please try again.');
    }
};

export default getTransporter;