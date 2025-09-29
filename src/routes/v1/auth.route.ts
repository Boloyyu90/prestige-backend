import { Router } from 'express';
import * as c from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validate';
import { auth } from '../../middlewares/auth';
import {
    loginSchema,
    refreshSchema,
    registerSchema,
    verifyQuerySchema,
    resendVerificationPublicSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../../validations/auth.validation';
import { simpleRateLimit } from '../../middlewares/rateLimit';

const router: import('express').Router = Router();

// Auth core
router.post('/register', validate(registerSchema), c.register);
router.post('/login', simpleRateLimit(), validate(loginSchema), c.login);
router.post('/refresh-tokens', validate(refreshSchema), c.refresh);
router.post('/logout', validate(refreshSchema), c.logout);

// Email verification
router.get('/verify-email', validate(verifyQuerySchema), c.verifyEmail);
router.post('/send-verification-email', auth(), c.sendVerificationEmail);

// P1-2: Public resend (rate-limited)
router.post(
    '/resend-verification',
    simpleRateLimit(),
    validate(resendVerificationPublicSchema),
    c.resendVerificationPublic,
);

router.post(
    '/forgot-password',
    simpleRateLimit(),
    validate(forgotPasswordSchema),
    c.forgotPassword
);

router.post('/reset-password', validate(resetPasswordSchema), c.resetPassword);



// (opsional) test email transporter
// router.get('/test-email', async (_req, res) => { ... })

export default router;
