import express from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as c from '../../controllers/user.controller';
import { createUserSchema, getUserSchema, updateUserSchema } from '../../validations/user.validation';

const router = express.Router();

router.post('/', auth('manageUsers'), validate(createUserSchema), c.createUser);
router.get('/', auth('getUsers'), c.listUsers);
router.get('/:userId', auth('getUsers'), validate(getUserSchema), c.getUser);
router.patch('/:userId', auth('manageUsers'), validate(updateUserSchema), c.updateUser);
router.delete('/:userId', auth('manageUsers'), validate(getUserSchema), c.deleteUser);

export default router;
