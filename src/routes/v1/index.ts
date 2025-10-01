import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import examRoute from './exam.route';
import questionRoute from './question.route';
import proctoringRoute from './proctoring.route';
import resultsRoute from './results.route';
import userExamRoute from './user-exam.route';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/exams', examRoute);
router.use('/questions', questionRoute);
router.use('/proctoring', proctoringRoute);
router.use('/results', resultsRoute);
router.use('/user-exams', userExamRoute);

export default router;