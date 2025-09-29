import express from 'express';
import authRoute from './auth.route';
import userRoute from './user.route';
import examRoute from './exam.route';
import questionRoute from './question.route';

const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/exams', examRoute);
router.use('/questions', questionRoute);

export default router;