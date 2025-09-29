import prisma from '../client';
import type { PrismaClient } from '../client';
import { hashPassword } from '../utils/password';
import type { UserRole } from '../types/prisma';
import { Errors } from '../utils/errors';
import { sanitizeEmail, sanitizeName } from '../utils/sanitize';

export const createUser = async (args: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}) => {
    const { name, email, password, role = 'PARTICIPANT' } = args;

    const normalizedEmail = sanitizeEmail(email);
    const normalizedName = sanitizeName(name);

    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) throw Errors.Conflict('Email already registered');

    const passwordHash = await hashPassword(password);

    return prisma.user.create({
        data: {
            name: normalizedName,
            email: normalizedEmail,
            password: passwordHash,
            role,
            isEmailVerified: true
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true
        },
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
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true
        },
    });

export const updateUser = async (
    id: number,
    data: { name?: string; email?: string; password?: string },
) => {
    const patch: Record<string, unknown> = {};

    if (data.name) {
        patch.name = sanitizeName(data.name);
    }

    if (data.email) {
        const normalizedEmail = sanitizeEmail(data.email);
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing && existing.id !== id) {
            throw Errors.Conflict('Email already registered');
        }
        patch.email = normalizedEmail;
    }

    if (data.password) {
        patch.password = await hashPassword(data.password);
    }

    return prisma.user.update({
        where: { id },
        data: patch,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            updatedAt: true
        },
    });
};

export const deleteUser = async (id: number) => {
    await prisma.$transaction(async (tx: PrismaClient) => {
        // 1) tokens
        await tx.token.deleteMany({ where: { userId: id } });

        // 2) user_exams (answers & proctoring_events cascade from userExam)
        await tx.userExam.deleteMany({ where: { userId: id } });

        // 3) exam owned by user + exam_questions
        const exams = await tx.exam.findMany({
            where: { createdBy: id },
            select: { id: true }
        }) as Array<{ id: number }>;

        if (exams.length) {
            const examIds = exams.map((exam) => exam.id);
            await tx.examQuestion.deleteMany({ where: { examId: { in: examIds } } });
            await tx.exam.deleteMany({ where: { id: { in: examIds } } });
        }

        // 4) delete user
        await tx.user.delete({ where: { id } });
    });
};