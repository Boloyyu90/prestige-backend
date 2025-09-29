import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import * as c from '../../controllers/results.controller';

const router = Router();

router.get('/my', auth('viewResults'), c.getMyResults);
router.get('/exam/:examId/leaderboard', auth('viewResults'), c.getLeaderboard);

export default router;
