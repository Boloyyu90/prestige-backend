import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as users from '../services/user.service';

export const createUser = async (req: Request, res: Response) => {
    const u = await users.createUser(req.body);
    res.status(httpStatus.CREATED).json({ message: 'User created', user: u });
};

export const getUsers = async (_req: Request, res: Response) => {
    const list = await users.listUsers();
    res.status(httpStatus.OK).json({ users: list });
};

export const getUser = async (req: Request, res: Response) => {
    const id = Number(req.params.userId);
    const u = await users.getUserById(id);
    if (!u) return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
    res.status(httpStatus.OK).json({ user: u });
};

export const updateUser = async (req: Request, res: Response) => {
    const id = Number(req.params.userId);
    const u = await users.updateUser(id, req.body);
    res.status(httpStatus.OK).json({ message: 'User updated', user: u });
};

export const deleteUser = async (req: Request, res: Response) => {
    const id = Number(req.params.userId);
    await users.deleteUser(id);
    res.status(httpStatus.NO_CONTENT).send();
};
