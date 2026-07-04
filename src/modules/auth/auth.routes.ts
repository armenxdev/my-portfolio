import { Router } from 'express';
import {
    login,
    verifyOtp,
    refresh,
    logout,
    requestPasswordReset,
    resetPassword
} from './auth.ctrl';
import { loginLimiter, otpLimiter } from "../../middlewares/rate-limitter";
import { loginSchema, verifyOtpSchema, passwordResetSchema, resetPasswordSchema } from '../../schemas/auth.schema';
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import type { AuthRequest } from '../../middlewares/auth.middleware';
import {validateRequest} from "../../middlewares/joi.validate";

const router = Router();


router.post('/login', loginLimiter, validateRequest({ body: loginSchema }), login);

// /api/v1/auth/verify-otp
// Rate limited: 5 requests per 3 minutes
router.post('/verify-otp', otpLimiter, validateRequest({body: verifyOtpSchema}), verifyOtp);

// /api/v1/auth/refresh
router.post('/refresh', refresh);

// /api/v1/auth/logout
router.post('/logout', logout);

// /api/v1/auth/request-password-reset
router.post('/request-password-reset', validateRequest({body: passwordResetSchema}), requestPasswordReset);

// /api/v1/auth/reset-password
router.post('/reset-password', validateRequest({body: resetPasswordSchema}), resetPassword);


router.get('/profile', authenticate, (req: AuthRequest, res) => {
    res.json({
        success: true,
        data: {
            id: req.admin?.id,
            email: req.admin?.email,
        },
    });
});


router.get('/dashboard', authenticate, authorize('admin'), (req: AuthRequest, res) => {
    res.json({
        success: true,
        data: {
            message: 'Welcome to the admin dashboards!',
            admin: req.admin,
        },
    });
});

export default router;
