import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as examService from '../services/exam.service';

export async function createExam(req: Request, res: Response, next: NextFunction) {
    try {
        const exam = await examService.createExam({
            ...req.body,
            createdBy: req.user!.id
        });
        return res.status(httpStatus.CREATED).json({ message: 'Exam created', data: exam });
    } catch (error) {
        return next(error);
    }
}

export async function getExam(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.examId);
        const includeQuestions = req.query.includeQuestions === 'true';

        const exam = await examService.getExamById(id, includeQuestions);
        if (!exam) {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Exam not found' });
        }

        return res.status(httpStatus.OK).json({ data: exam });
    } catch (error) {
        return next(error);
    }
}

export async function listExams(req: Request, res: Response, next: NextFunction) {
    try {
        const filters = {
            createdBy: req.query.createdBy ? Number(req.query.createdBy) : undefined,
            status: req.query.status as 'upcoming' | 'ongoing' | 'finished' | undefined
        };

        const exams = await examService.listExams(filters);
        return res.status(httpStatus.OK).json({ data: exams });
    } catch (error) {
        return next(error);
    }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.examId);
        const exam = await examService.updateExam(id, req.body);
        return res.status(httpStatus.OK).json({ message: 'Exam updated', data: exam });
    } catch (error) {
        return next(error);
    }
}

export async function deleteExam(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.examId);
        await examService.deleteExam(id);
        return res.status(httpStatus.NO_CONTENT).send();
    } catch (error) {
        return next(error);
    }
}

export async function addQuestions(req: Request, res: Response, next: NextFunction) {
    try {
        const examId = Number(req.params.examId);
        const { questionIds, effectiveScores } = req.body;

        await examService.addQuestionsToExam(examId, questionIds, effectiveScores);
        return res.status(httpStatus.OK).json({ message: 'Questions added to exam' });
    } catch (error) {
        return next(error);
    }
}