import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                name: true,
                password: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { 
                userId: user.id,
                username: user.username,
                name: user.name,
                iat: Math.floor(Date.now() / 1000)
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 응답 생성 및 쿠키 설정
        const response = NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                name: user.name
            },
            message: 'Login successful'
        });

        // JWT 토큰을 HttpOnly 쿠키로 설정
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 24시간
            path: '/',
            sameSite: 'strict'
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 로그인 상태 확인 (토큰 검증)
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token');

        if (!token) {
            return NextResponse.json({ isAuthenticated: false });
        }

        try {
            const decoded = jwt.verify(token.value, JWT_SECRET) as {
                userId: string;
                username: string;
                name: string;
                iat: number;
            };
            
            // 토큰에서 사용자 정보 추출
            return NextResponse.json({ 
                isAuthenticated: true,
                user: {
                    id: decoded.userId,
                    username: decoded.username,
                    name: decoded.name
                }
            });
        } catch {
            // 토큰이 유효하지 않은 경우
            return NextResponse.json({ isAuthenticated: false });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ isAuthenticated: false });
    }
}

// 로그아웃
export async function DELETE() {
    try {
        const response = NextResponse.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
        
        // 쿠키 삭제
        response.cookies.delete('auth-token');
        
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
