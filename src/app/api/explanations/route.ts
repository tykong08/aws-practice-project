import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExplanation } from '@/lib/openai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questionId, question, options, correctAnswers } = body;

        // Generate explanation using OpenAI
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
