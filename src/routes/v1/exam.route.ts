import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as c from '../../controllers/exam.controller';
import * as v from '../../validations/exam.validation';

const router = Router();

// Exam management (Admin)
router.post('/', auth('manageExams'), validate(v.createExamSchema), c.createExam);
router.get('/', auth('getExams'), c.listExams);
router.get('/:examId', auth('getExams'), c.getExam);
router.patch('/:examId', auth('manageExams'), validate(v.updateExamSchema), c.updateExam);
router.delete('/:examId', auth('manageExams'), c.deleteExam);
router.post('/:examId/questions', auth('manageExams'), validate(v.addQuestionsToExamSchema), c.addQuestions);

// Exam taking (Participant)
router.post('/:examId/start', auth('takeExam'), validate(v.startExamSchema), c.startExam);
router.post('/session/:userExamId/answer/:questionId', auth('takeExam'), validate(v.submitAnswerSchema), c.submitAnswer);
router.post('/session/:userExamId/finish', auth('takeExam'), validate(v.finishExamSchema), c.finishExam);
router.get('/session/:userExamId/progress', auth('takeExam'), c.getProgress);

export default router;
