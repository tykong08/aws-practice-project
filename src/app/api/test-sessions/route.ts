import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, totalQuestions, correctAnswers, incorrectAnswers, timeSpent, results } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Save study session
        const session = await prisma.studySession.create({
            data: {
                userId,
                totalQuestions,
                correctAnswers,
                incorrectAnswers,
                timeSpent,
            },
        });

        // Save individual attempts
        if (results && Array.isArray(results)) {
            for (const result of results) {
                await prisma.userAttempt.create({
                    data: {
                        questionId: result.question.id,
                        userId,
                        selectedAnswers: JSON.stringify(result.userAnswer),
                        isCorrect: result.isCorrect,
                        timeSpent: Math.floor(timeSpent / totalQuestions), // Average time per question
                    },
                });
            }
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error('Error saving test session:', error);
        return NextResponse.json(
            { error: 'Failed to save test session' },
            { status: 500 }
        );
    }
}
