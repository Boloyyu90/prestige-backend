import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { roleRights, Right } from '../config/roles';

export type UserRole = 'ADMIN' | 'PARTICIPANT';

export type JwtUser = {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    isEmailVerified?: boolean;
};

export interface AuthenticatedRequest extends Request {
    user: JwtUser;
}

export const auth = (...required: Right[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const h = req.headers.authorization;
            if (!h?.startsWith('Bearer ')) {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
            }
            const token = h.substring('Bearer '.length);

            const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload & {
                sub: number;
                email: string;
                name: string;
                role: UserRole;
                type?: string;
                isEmailVerified?: boolean;
            };

            // Hanya ACCESS token yang valid
            if (payload.type && payload.type !== 'ACCESS') {
                return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Invalid token type' });
            }

            (req as AuthenticatedRequest).user = {
                id: Number(payload.sub),
                email: payload.email,
                name: payload.name,
                role: payload.role,
                isEmailVerified: payload.isEmailVerified,
            };

            if (!required.length) return next();

            const rights = roleRights.get((req as AuthenticatedRequest).user.role) ?? [];
            const ok = required.every((r) => rights.includes(r));

            const sameUser =
                req.params?.userId && Number(req.params.userId) === (req as AuthenticatedRequest).user.id;

            if (!ok && !sameUser) {
                return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
            }
            return next();
        } catch {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }
    };
};
