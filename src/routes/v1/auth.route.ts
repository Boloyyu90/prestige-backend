import express from 'express';
import * as c from '../../controllers/auth.controller';
import { validate } from '../../middlewares/validate';
import { loginSchema, refreshSchema, registerSchema, verifyQuerySchema } from '../../validations/auth.validation';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post('/register', validate(registerSchema), c.register);
router.post('/login', validate(loginSchema), c.login);
router.post('/refresh-tokens', validate(refreshSchema), c.refresh);
router.post('/logout', validate(refreshSchema), c.logout);

router.post('/send-verification-email', auth(), c.sendVerificationEmail);
router.get('/verify-email', validate(verifyQuerySchema), c.verifyEmail);

export default router;
