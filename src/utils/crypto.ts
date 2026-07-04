import { randomInt, createHash, randomUUID } from 'crypto';
import bcrypt from "bcryptjs";

export const generateOtpCode = () => String(randomInt(100000, 999999));

export const generateJti = () => randomUUID();

export const hashToken = (token: string) => bcrypt.hash(token, 12)