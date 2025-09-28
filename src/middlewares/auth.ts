import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { roleRights, Right } from '../config/roles';

export const auth = (...required: Right[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const h = req.headers.authorization;
            if (!h?.startsWith('Bearer ')) return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
            const token = h.split(' ')[1];
            const p: any = jwt.verify(token, config.jwt.secret);
            (req as any).user = { id: Number(p.sub), email: p.email, name: p.name, role: p.role };

            if (!required.length) return next();
            const rights = roleRights.get((req as any).user.role) ?? [];
            const ok = required.every(r => rights.includes(r));
            const sameUser = req.params?.userId && Number(req.params.userId) === (req as any).user.id;
            if (!ok && !sameUser) return res.status(httpStatus.FORBIDDEN).json({ message: 'Forbidden' });
            next();
        } catch {
            res.status(httpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
        }
    };
};
