import prisma from '../client';
import type { PrismaClient } from '../client';
import { hashPassword } from '../utils/password';
import type { UserRole } from '../types/prisma';

export const createUser = async (args: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}) => {
    const { name, email, password, role = 'PARTICIPANT' } = args;

    const normalizedEmail = email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw new Error('Email already registered');

    const passwordHash = await hashPassword(password);

    return prisma.user.create({
        data: { name, email: normalizedEmail, password: passwordHash, role, isEmailVerified: true },
        select: { id: true, name: true, email: true, role: true, isEmailVerified: true, createdAt: true },
    });
};

export const getUserById = (id: number) =>
    prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

export const listUsers = () =>
    prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, isEmailVerified: true, createdAt: true },
    });

export const updateUser = async (
    id: number,
    data: { name?: string; email?: string; password?: string },
) => {
    if (data.email) {
        const normalizedEmail = data.email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== id) {
            throw new Error('Email already registered');
        }
        data.email = normalizedEmail;
    }

    const patch: Record<string, unknown> = {};
    if (data.name) patch.name = data.name;
    if (data.email) patch.email = data.email;
    if (data.password) patch.password = await hashPassword(data.password);

    return prisma.user.update({
        where: { id },
        data: patch,
        select: { id: true, name: true, email: true, role: true, isEmailVerified: true, updatedAt: true },
    });
};

/**
 * P0: Hapus user aman terhadap relasi (tokens, user_exams, exams, exam_questions)
 */
export const deleteUser = async (id: number) => {
    await prisma.$transaction(async (tx: PrismaClient) => {
        // 1) tokens
        await tx.token.deleteMany({ where: { userId: id } });

        // 2) user_exams (answers & proctoring_events cascade dari userExam)
        await tx.userExam.deleteMany({ where: { userId: id } });

        // 3) exam milik user + exam_questions
        const exams = await tx.exam.findMany({ where: { createdBy: id }, select: { id: true } }) as Array<{ id: number }>;
        if (exams.length) {
            const examIds = exams.map((exam) => exam.id);
            await tx.examQuestion.deleteMany({ where: { examId: { in: examIds } } });
            await tx.exam.deleteMany({ where: { id: { in: examIds } } });
        }

        // 4) hapus user
        await tx.user.delete({ where: { id } });
    });
};
