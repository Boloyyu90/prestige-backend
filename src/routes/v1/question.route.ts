import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as c from '../../controllers/question.controller';
import * as v from '../../validations/question.validation';

const router = Router();

router.post('/', auth('manageQuestions'), validate(v.createQuestionSchema), c.createQuestion);
router.get('/', auth('getQuestions'), c.listQuestions);
router.get('/:questionId', auth('getQuestions'), c.getQuestion);
router.patch('/:questionId', auth('manageQuestions'), validate(v.updateQuestionSchema), c.updateQuestion);
router.delete('/:questionId', auth('manageQuestions'), c.deleteQuestion);
router.post('/bulk-import', auth('manageQuestions'), validate(v.bulkImportQuestionsSchema), c.bulkImport);

export default router;
