import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as resultsService from '../services/results.service';

export async function getMyResults(req: Request, res: Response, next: NextFunction) {
    try {
        const results = await resultsService.getUserResults(req.user!.id);
        return res.status(httpStatus.OK).json({ data: results });
    } catch (error) {
        return next(error);
    }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
        const examId = Number(req.params.examId);
        const limit = req.query.limit ? Number(req.query.limit) : 10;

        const leaderboard = await resultsService.getExamLeaderboard(examId, limit);
        return res.status(httpStatus.OK).json({ data: leaderboard });
    } catch (error) {
        return next(error);
    }
}