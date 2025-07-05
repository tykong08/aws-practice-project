import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questionId, selectedAnswers, isCorrect, timeSpent, userId } = body;

        console.log('📝 Attempt data received:', {
            questionId,
            selectedAnswers,
            isCorrect,
            timeSpent,
            userId
        });

        if (!userId) {
            console.error('❌ User ID is missing');
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!questionId) {
            console.error('❌ Question ID is missing');
            return NextResponse.json(
                { error: 'Question ID is required' },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.error('❌ User not found:', userId);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify question exists
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) {
            console.error('❌ Question not found:', questionId);
            return NextResponse.json(
                { error: 'Question not found' },
                { status: 404 }
            );
        }

        const attempt = await prisma.userAttempt.create({
            data: {
                questionId,
                userId,
                selectedAnswers: JSON.stringify(selectedAnswers), // 0-based 인덱스 그대로 저장
                isCorrect,
                timeSpent: timeSpent || 0,
            },
        });

        console.log('✅ Attempt saved successfully:', attempt.id);
        return NextResponse.json(attempt);
    } catch (error) {
        console.error('❌ Error saving attempt:', error);
        return NextResponse.json(
            { error: 'Failed to save attempt', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
