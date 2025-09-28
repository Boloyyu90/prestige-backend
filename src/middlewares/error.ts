// src/middlewares/error.ts
import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

type AppError = Error & { status?: number; statusCode?: number };

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    // Zod validation error
    if (err instanceof ZodError) {
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Validation error',
            errors: err.issues, // <-- pakai .issues
        });
    }

    // Prisma known errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(httpStatus.CONFLICT).json({ message: 'Unique constraint violation' });
        }
        if (err.code === 'P2025') {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Record not found' });
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'Database error',
            code: err.code,
            meta: err.meta,
        });
    }

    // Prisma validation error
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: 'Invalid request to database' });
    }

    const status =
        err.statusCode ||
        err.status ||
        (String(err.message || '').toLowerCase().includes('unauthorized') ? httpStatus.UNAUTHORIZED : null) ||
        httpStatus.INTERNAL_SERVER_ERROR;

    const body: Record<string, unknown> = {
        message: err.message || 'Internal server error',
    };
    if (process.env.NODE_ENV !== 'production') {
        body.stack = err.stack;
    }

    return res.status(status).json(body);
}
