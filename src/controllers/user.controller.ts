import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as users from '../services/user.service';

export const listUsers = async (_req: Request, res: Response) => {
    const data = await users.listUsers();
    return res.status(httpStatus.OK).json({ data });
};

export const getUser = async (req: Request, res: Response) => {
    const id = Number(req.params.userId);
    const data = await users.getUserById(id);
    if (!data) return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
    return res.status(httpStatus.OK).json({ data });
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const data = await users.createUser(req.body);
        return res.status(httpStatus.CREATED).json({ message: 'User created', data });
    } catch (e: any) {
        if (String(e?.message).includes('Email already registered')) {
            return res.status(httpStatus.CONFLICT).json({ message: 'Email already registered' });
        }
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message ?? 'Internal error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const id = Number(req.params.userId);
    try {
        const data = await users.updateUser(id, req.body);
        return res.status(httpStatus.OK).json({ message: 'User updated', data });
    } catch (e: any) {
        const msg = String(e?.message ?? '');
        if (msg.includes('Email already registered')) {
            return res.status(httpStatus.CONFLICT).json({ message: 'Email already registered' });
        }
        if (e?.code === 'P2025') {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
        }
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: e?.message ?? 'Internal error' });
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.userId);
    try {
        await users.deleteUser(id);
        return res.status(httpStatus.NO_CONTENT).send();
    } catch (e: any) {
        if (e?.code === 'P2025') {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
        }
        return next(e);
    }
};
