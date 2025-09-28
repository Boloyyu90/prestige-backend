import 'express';
import type { UserRole } from '@prisma/client';

declare global {
    namespace Express {
        interface JwtUser {
            id: number;
            email: string;
            name: string;
            role: UserRole;
            isEmailVerified?: boolean;
        }
        interface Request {
            user?: JwtUser;       // ← sekarang Request resmi punya user
        }
    }
}
