import bcrypt from 'bcryptjs';
import {generateOtpCode, hashToken} from '../../utils/crypto.js';
import {sendOtpEmail} from "./email.svc";
import {AppError} from "../../utils/app-error";
import {redisClient} from "../../config/redis";


class OtpService {
    public static OTP_EXPIRY_MINUTES    = 180

    async createAndSaveOtp(adminId: number): Promise<string> {
        const otpCode = generateOtpCode();
        console.log(otpCode)
        const hashedCode = await hashToken(otpCode);

        const redisKey = `admin:otp:${adminId}`;

        await redisClient.setex(redisKey, OtpService.OTP_EXPIRY_MINUTES * 60, hashedCode);

        return otpCode;
    }

    async verifyAndConsumeOtp(adminId: number, inputCode: string): Promise<void> {
        const otpKey = `admin:otp:${adminId}`;

        // 1. Վերցնում ենք հեշը Redis-ից
        const hashedOtp = await redisClient.get(otpKey);

        if (!hashedOtp) {
            throw new AppError('Verification code has expired or is invalid', 400);
        }

        const isMatch = await bcrypt.compare(inputCode, hashedOtp);

        if (!isMatch) {
            throw new AppError('Invalid verification code', 400);
        }

        // 3. Եթե ճիշտ է, ակնթարթորեն ջնջում ենք, որ 2-րդ անգամ չօգտագործվի
        await redisClient.del(otpKey);
    }
}
export default  OtpService;

