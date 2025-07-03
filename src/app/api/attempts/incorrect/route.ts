import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get questions that were answered incorrectly in the most recent attempt
        const incorrectAttempts = await prisma.userAttempt.findMany({
            where: {
                userId: userId
            },
            include: {
                question: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group by questionId and get the latest attempt for each question
        const latestAttempts = new Map();
        incorrectAttempts.forEach(attempt => {
            if (!latestAttempts.has(attempt.questionId)) {
                latestAttempts.set(attempt.questionId, attempt);
            }
        });

        // Filter to only include questions where the latest attempt was incorrect
        const stillIncorrectAttempts = Array.from(latestAttempts.values())
            .filter(attempt => !attempt.isCorrect);

        // Transform the data to include parsed JSON fields (convert 1-based to 0-based)
        const transformedAttempts = stillIncorrectAttempts.map(attempt => ({
            ...attempt,
            selectedAnswers: JSON.parse(attempt.selectedAnswers).map((answer: number) => answer - 1),
            question: {
                ...attempt.question,
                correctAnswers: JSON.parse(attempt.question.correctAnswers).map((answer: number) => answer - 1),
                keywords: attempt.question.keywords ? JSON.parse(attempt.question.keywords) : []
            }
        }));

        return NextResponse.json(transformedAttempts);
    } catch (error) {
        console.error('Error fetching incorrect attempts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incorrect attempts' },
            { status: 500 }
        );
    }
}
