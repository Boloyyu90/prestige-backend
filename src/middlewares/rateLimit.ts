import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { config } from '../config/config';

// In-memory simple rate limiter per IP + path (cukup untuk dev/MVP)
const hits = new Map<string, { count: number; resetAt: number }>();

export function simpleRateLimit() {
    const windowMs = config.rateLimit.windowMs;
    const max = config.rateLimit.max;

    return (req: Request, res: Response, next: NextFunction) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const rec = hits.get(key);

        if (!rec || rec.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (rec.count >= max) {
            const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            return res
                .status(httpStatus.TOO_MANY_REQUESTS)
                .json({ message: 'Too many requests, please try again later' });
        }

        rec.count += 1;
        hits.set(key, rec);
        return next();
    };
}
