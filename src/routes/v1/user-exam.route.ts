import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as c from '../../controllers/user-exam.controller';
import * as v from '../../validations/exam.validation';

const router = Router();

// Exam taking endpoints
router.post('/:examId/start', auth('takeExam'), validate(v.startExamSchema), c.startExam);
router.post('/session/:userExamId/answer/:questionId', auth('takeExam'), validate(v.submitAnswerSchema), c.submitAnswer);
router.post('/session/:userExamId/finish', auth('takeExam'), validate(v.finishExamSchema), c.finishExam);
router.get('/session/:userExamId/progress', auth('takeExam'), c.getProgress);
router.get('/my-attempts', auth('takeExam'), c.getMyAttempts);

export default router;