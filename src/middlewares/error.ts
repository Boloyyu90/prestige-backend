import { Request, Response, NextFunction } from 'express';
import { isAppError, createPrismaError, normalizeError, AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { config } from '../config/config';

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) {
    // Log error in development
    if (!config.isProd) {
        console.error('Error:', err);
    }

    // Handle Zod validation
    if (err instanceof ZodError) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message
            }))
        });
    }

    // Handle Prisma errors
    if (err instanceof PrismaClientKnownRequestError) {
        const appError = createPrismaError(err);
        return res.status(appError.statusCode).json(appError.toJSON());
    }

    // Handle AppError with specific codes
    if (isAppError(err)) {
        // Special handling for specific error codes
        if (err.code === 'EMAIL_NOT_VERIFIED') {
            return res.status(err.statusCode).json({
                ...err.toJSON(),
                hint: 'Please check your inbox or use /v1/auth/send-verification-email'
            });
        }

        return res.status(err.statusCode).json(err.toJSON());
    }

    // Normalize unknown errors
    const appError = normalizeError(err);

    // Don't expose internal error details in production
    if (config.isProd && appError.statusCode === 500) {
        return res.status(500).json({
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }

    return res.status(appError.statusCode).json(appError.toJSON());
}