import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedCount = parseInt(searchParams.get('count') || '10');

        // Get total count of questions
        const totalQuestions = await prisma.question.count();

        // Ensure we don't request more questions than available
        const count = Math.min(requestedCount, totalQuestions);

        // If requested count is more than available, we'll return all available questions
        let questions;
        if (count >= totalQuestions) {
            // Get all questions and shuffle them
            questions = await prisma.question.findMany({
                orderBy: {
                    id: 'asc'
                }
            });
            // Shuffle the array
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        } else {
            // Generate random skip value
            const skip = Math.max(0, Math.floor(Math.random() * Math.max(0, totalQuestions - count)));

            // Get random questions
            questions = await prisma.question.findMany({
                take: count,
                skip: skip,
                orderBy: {
                    id: 'asc' // Consistent ordering for pagination
                }
            });
        }

        // Transform the questions to include parsed correctAnswers
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
        }));

        return NextResponse.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching random questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
