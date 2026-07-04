import Joi from 'joi';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-\[\]{}|;':",./<>?~`^\\]).+$/;


export const registerSchema = Joi.object({
    email: Joi.string()
        .required()
        .pattern(EMAIL_REGEX)
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'string.pattern.base': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .required()
        .min(12)
        .max(64)
        .pattern(PASSWORD_REGEX)
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 12 characters long',
            'string.max': 'Password cannot exceed 64 characters',

            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character such',
            'any.required': 'Password is required',
        }),


});

export const loginSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required',
        }),
});

/**
 * 3. Verify OTP Schema
 */
export const verifyOtpSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'any.required': 'Email is required',
        }),
    otp: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .messages({
            'string.length': 'Verification code must be exactly 6 digits',
            'string.pattern.base': 'Verification code must be exactly 6 digits',
        }),
    twoFACode: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .messages({
            'string.length': '2FA code must be exactly 6 digits',
            'string.pattern.base': '2FA code must be exactly 6 digits',
        }),
});

export const refreshTokenSchema = Joi.object({});
export const logoutSchema = Joi.object({});

/**
 * 4. Password Reset Schema
 */
export const passwordResetSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'any.required': 'Email is required',
        }),
});

/**
 * 5. Reset Password with Code Schema
 */
export const resetPasswordSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .lowercase()
        .messages({
            'string.empty': 'Email is required',
            'any.required': 'Email is required',
        }),
    resetCode: Joi.string()
        .required()
        .length(6)
        .pattern(/^\d{6}$/)
        .messages({
            'string.empty': 'Reset code is required',
            'string.length': 'Reset code must be exactly 6 digits',
            'string.pattern.base': 'Reset code must be exactly 6 digits',
            'any.required': 'Reset code is required',
        }),
    newPassword: Joi.string()
        .required()
        .min(12)
        .max(64)
        .pattern(PASSWORD_REGEX)
        .messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 12 characters long',
            'string.max': 'New password cannot exceed 64 characters',
            'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            'any.required': 'New password is required',
        }),
});

