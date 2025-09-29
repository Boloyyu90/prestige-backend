import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as proctoringService from '../services/proctoring.service';

export async function recordEvent(req: Request, res: Response, next: NextFunction) {
    try {
        const userExamId = Number(req.params.userExamId);
        const event = await proctoringService.recordProctoringEvent({
            userExamId,
            ...req.body
        });
        return res.status(httpStatus.CREATED).json({
            message: 'Event recorded',
            data: event
        });
    } catch (error) {
        return next(error);
    }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
    try {
        const userExamId = Number(req.params.userExamId);
        const stats = await proctoringService.getProctoringStats(userExamId);
        return res.status(httpStatus.OK).json({ data: stats });
    } catch (error) {
        return next(error);
    }
}

