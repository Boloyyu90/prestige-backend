export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'AppError';
    }

    toJSON() {
        return {
            message: this.message,
            code: this.code,
            statusCode: this.statusCode
        };
    }
}

// Simple factory functions for common errors
export const Errors = {
    Unauthorized: (msg = 'Unauthorized') => new AppError(msg, 401, 'UNAUTHORIZED'),
    Forbidden: (msg = 'Forbidden') => new AppError(msg, 403, 'FORBIDDEN'),
    NotFound: (msg = 'Not found') => new AppError(msg, 404, 'NOT_FOUND'),
    Conflict: (msg = 'Already exists') => new AppError(msg, 409, 'CONFLICT'),
    BadRequest: (msg = 'Bad request') => new AppError(msg, 400, 'BAD_REQUEST'),
};

export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

export function normalizeError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Error) {
        return new AppError(error.message);
    }
    if (typeof error === 'string') {
        return new AppError(error);
    }
    return new AppError('Unknown error');
}

export function createPrismaError(error: any): AppError {
    switch (error?.code) {
        case 'P2002': return Errors.Conflict('Duplicate entry');
        case 'P2025': return Errors.NotFound('Record not found');
        default: return new AppError('Database error', 500, 'DB_ERROR');
    }
}