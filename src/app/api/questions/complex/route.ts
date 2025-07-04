import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'many-options'; // many-options, many-answers, complex

        let questions;

        if (type === 'many-options') {
            // 5-6개 선지가 있는 문제들
            questions = await prisma.question.findMany({
                where: {
                    OR: [
                        { option5: { not: null } },
                        { option6: { not: null } }
                    ]
                },
                take: 10
            });
        } else if (type === 'many-answers') {
            // 모든 문제를 가져와서 3개 이상 정답 필터링
            const allQuestions = await prisma.question.findMany();
            questions = allQuestions.filter(q => {
                try {
                    const answers = JSON.parse(q.correctAnswers);
                    return answers.length >= 3;
                } catch {
                    return false;
                }
            }).slice(0, 10);
        } else if (type === 'complex') {
            // 5-6개 선지 + 다중 정답 조합
            const manyOptionsQuestions = await prisma.question.findMany({
                where: {
                    OR: [
                        { option5: { not: null } },
                        { option6: { not: null } }
                    ]
                }
            });

            questions = manyOptionsQuestions.filter(q => {
                try {
                    const answers = JSON.parse(q.correctAnswers);
                    return answers.length > 1;
                } catch {
                    return false;
                }
            }).slice(0, 10);
        } else {
            return NextResponse.json(
                { error: 'Invalid type parameter. Use: many-options, many-answers, or complex' },
                { status: 400 }
            );
        }

        // Transform the questions to include parsed correctAnswers
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
        }));

        return NextResponse.json({
            type,
            count: transformedQuestions.length,
            questions: transformedQuestions
        });
    } catch (error) {
        console.error('Error fetching complex questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
