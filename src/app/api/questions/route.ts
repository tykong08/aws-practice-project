import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform the questions to include parsed correctAnswers (convert 1-based to 0-based)
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers).map((answer: number) => answer - 1),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
        }));

        return NextResponse.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { question, option1, option2, option3, option4, option5, option6, correctAnswers, difficulty, topic } = body;

        const newQuestion = await prisma.question.create({
            data: {
                question,
                option1,
                option2,
                option3,
                option4,
                option5: option5 || null,
                option6: option6 || null,
                correctAnswers: JSON.stringify(correctAnswers),
                difficulty,
                topic,
            },
        });

        // Return the question with parsed correctAnswers (convert 1-based to 0-based)
        const transformedQuestion = {
            ...newQuestion,
            correctAnswers: JSON.parse(newQuestion.correctAnswers).map((answer: number) => answer - 1),
            keywords: newQuestion.keywords ? JSON.parse(newQuestion.keywords) : []
        };

        return NextResponse.json(transformedQuestion);
    } catch (error) {
        console.error('Error creating question:', error);
        return NextResponse.json(
            { error: 'Failed to create question' },
            { status: 500 }
        );
    }
}
