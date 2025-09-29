import prisma from '../client';
import type { PrismaClient } from '../client';
import type { ProctoringEventType } from '../types/prisma';
import { Errors } from '../utils/errors';

// Single event recording (existing)
export async function recordProctoringEvent(data: {
    userExamId: number;
    eventType: ProctoringEventType;
    duration?: number;
    metadata?: any;
}) {
    const userExam = await prisma.userExam.findFirst({
        where: { id: data.userExamId, status: 'IN_PROGRESS' }
    });

    if (!userExam) throw Errors.BadRequest('Invalid or inactive exam session');

    return await prisma.$transaction(async (tx: PrismaClient) => {
        const event = await tx.proctoringEvent.create({
            data: {
                userExamId: data.userExamId,
                eventType: data.eventType,
                metadata: data.metadata
            }
        });

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

// Calculate proctoring score
export function calculateProctoringScore(userExam: {
    faceNotDetectedSec: number;
    multipleFacesCount: number;
    phoneDetectedCount: number;
}): {
    total: number;
    breakdown: {
        faceNotDetected: number;
        multipleFaces: number;
        phoneDetected: number;
    };
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
} {
    const weights = {
        faceNotDetected: 0.5,    // per second
        multipleFaces: 15,       // per occurrence
        phoneDetected: 25        // per occurrence
    };

    const breakdown = {
        faceNotDetected: userExam.faceNotDetectedSec * weights.faceNotDetected,
        multipleFaces: userExam.multipleFacesCount * weights.multipleFaces,
        phoneDetected: userExam.phoneDetectedCount * weights.phoneDetected
    };

    const total = Math.min(100,
        breakdown.faceNotDetected +
        breakdown.multipleFaces +
        breakdown.phoneDetected
    );

    const severity =
        total === 0 ? 'none' :
            total < 20 ? 'low' :
                total < 40 ? 'medium' :
                    total < 70 ? 'high' : 'critical';

    return { total, breakdown, severity };
}

// Get stats (improved)
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

    if (!userExam) throw Errors.NotFound('Exam session not found');

    const calculatedScore = calculateProctoringScore(userExam);

    return {
        ...userExam,
        calculatedScore
    };
}