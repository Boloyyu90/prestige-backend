import prisma from '../client';
import { hashPassword } from '../utils/password';
import { UserRole } from '@prisma/client';

export const createUser = async (
    { name, email, password, role = 'PARTICIPANT' as UserRole }:
    { name: string; email: string; password: string; role?: UserRole }
) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Email already registered');

    const passwordHash = await hashPassword(password);
    return prisma.user.create({
        data: { name, email, password: passwordHash, role, isEmailVerified: true },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
};

export const getUserById = (id: number) =>
    prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } });

export const listUsers = () =>
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, createdAt: true } });

export const updateUser = async (id: number, data: { name?: string; email?: string; password?: string }) => {
    const patch: any = {};
    if (data.name) patch.name = data.name;
    if (data.email) patch.email = data.email;
    if (data.password) patch.password = await hashPassword(data.password);
    return prisma.user.update({ where: { id }, data: patch, select: { id: true, name: true, email: true, role: true, updatedAt: true } });
};

export const deleteUser = (id: number) => prisma.user.delete({ where: { id } });
