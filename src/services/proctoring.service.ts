import prisma from '../client';
import type { PrismaClient } from '../client';
import type { ProctoringEventType } from '../types/prisma';

export async function recordProctoringEvent(data: {
    userExamId: number;
    eventType: ProctoringEventType;
    duration?: number;
    metadata?: any;
}) {
    // Check if exam session is in progress
    const userExam = await prisma.userExam.findFirst({
        where: { id: data.userExamId, status: 'IN_PROGRESS' }
    });

    if (!userExam) throw new Error('Invalid or inactive exam session');

    // Create event and update counters
    return await prisma.$transaction(async (tx: PrismaClient) => {
        // Create event
        const event = await tx.proctoringEvent.create({
            data: {
                userExamId: data.userExamId,
                eventType: data.eventType,
                metadata: data.metadata
            }
        });

        // Update summary counters
        const updateData: any = {};

        switch (data.eventType) {
            case 'FACE_NOT_DETECTED':
                updateData.faceNotDetectedSec = { increment: data.duration || 5 };
                break;
            case 'MULTIPLE_FACES':
                updateData.multipleFacesCount = { increment: 1 };
                break;
            case 'PHONE_DETECTED':
                updateData.phoneDetectedCount = { increment: 1 };
                break;
        }

        await tx.userExam.update({
            where: { id: data.userExamId },
            data: updateData
        });

        return event;
    });
}

export async function getProctoringStats(userExamId: number) {
    const userExam = await prisma.userExam.findUnique({
        where: { id: userExamId },
        select: {
            faceNotDetectedSec: true,
            multipleFacesCount: true,
            phoneDetectedCount: true,
            cheatingScore: true,
            proctoringEvents: {
                select: {
                    eventType: true,
                    eventTime: true,
                    metadata: true
                },
                orderBy: { eventTime: 'asc' }
            }
        }
    });

    if (!userExam) throw new Error('Exam session not found');

    // Calculate cheating score (simple formula)
    const cheatingScore =
        (userExam.faceNotDetectedSec * 0.1) +
        (userExam.multipleFacesCount * 10) +
        (userExam.phoneDetectedCount * 15);

    return {
        ...userExam,
        calculatedCheatingScore: Math.min(100, cheatingScore)
    };
}