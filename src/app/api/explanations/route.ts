import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExplanation } from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questionId, question, options, correctAnswers } = body;

        // First, check if explanation already exists
        const existingQuestion = await prisma.question.findUnique({
            where: { id: questionId },
            select: { explanation: true, keywords: true }
        });

        if (existingQuestion?.explanation) {
            // Return existing explanation
            const keywords = existingQuestion.keywords ? JSON.parse(existingQuestion.keywords) : [];
            return NextResponse.json({
                explanation: existingQuestion.explanation,
                keywords
            });
        }

        // Generate explanation using OpenAI only if it doesn't exist
        const { explanation, keywords } = await generateExplanation(question, options, correctAnswers);

        // Update the question with the generated explanation and keywords
        await prisma.question.update({
            where: { id: questionId },
            data: {
                explanation,
                keywords: JSON.stringify(keywords),
            },
        });

        return NextResponse.json({ explanation, keywords });
    } catch (error) {
        console.error('Error generating explanation:', error);
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
