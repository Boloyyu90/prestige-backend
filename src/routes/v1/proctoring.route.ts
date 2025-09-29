import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as c from '../../controllers/proctoring.controller';
import * as v from '../../validations/proctoring.validation';

const router = Router();

router.post('/session/:userExamId/event',
    auth('takeExam'),
    validate(v.recordProctoringEventSchema),
    c.recordEvent
);

router.get('/session/:userExamId/stats',
    auth('viewProctoringEvents'),
    c.getStats
);

export default router;
