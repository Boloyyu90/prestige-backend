import type { ZodType } from 'zod';
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';

type RequestShape = { body?: unknown; query?: unknown; params?: unknown };

export const validate =
    (schema: ZodType<RequestShape>) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                schema.parse({ body: req.body, query: req.query, params: req.params });
                next();
            } catch (err: any) {
                res.status(httpStatus.BAD_REQUEST).json({
                    message: 'Validation error',
                    errors: err?.errors ?? err?.message,
                });
            }
        };
