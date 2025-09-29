// src/middlewares/error.ts
import { Request, Response, NextFunction } from 'express';
import { isAppError, createPrismaError, normalizeError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    // Handle Zod validation
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.issues
        });
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = createPrismaError(err);
        return res.status(appError.statusCode).json(appError.toJSON());
    }

    // Handle AppError
    if (isAppError(err)) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Normalize unknown errors
    const appError = normalizeError(err);
    return res.status(appError.statusCode).json(appError.toJSON());
}