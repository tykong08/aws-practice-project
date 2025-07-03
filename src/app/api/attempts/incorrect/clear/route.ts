import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Delete all incorrect attempts for the user
        const deletedAttempts = await prisma.userAttempt.deleteMany({
            where: {
                userId: userId,
                isCorrect: false
            }
        });

        console.log(`🗑️ Deleted ${deletedAttempts.count} incorrect attempts for user ${userId}`);

        return NextResponse.json({
            success: true,
            deletedCount: deletedAttempts.count,
            message: 'Incorrect attempts cleared successfully'
        });
    } catch (error) {
        console.error('❌ Error clearing incorrect attempts:', error);
        return NextResponse.json(
            { error: 'Failed to clear incorrect attempts', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
