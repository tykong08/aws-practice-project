'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Target, LogOut, User } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 (JWT 쿠키 삭제)
      await fetch('/api/auth/login', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 로컬 스토리지도 정리
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AWS SAA-C03 연습 사이트
            </h1>
            <p className="text-xl text-gray-600">
              AWS Solutions Architect Associate 시험을 위한 문제 연습과 복습
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <User className="h-5 w-5" />
              <span>{user.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-gray-700 border-gray-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </header>

        {/* Dark Mode Notice */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>알림:</strong> 더 나은 사용 경험을 위해 브라우저의 어두운 모드(다크 모드)를 해제해 주세요. 이 사이트는 밝은 테마에 최적화되어 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">문제 연습</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  AWS SAA-C03 시험 문제를 연습하고 실력을 테스트하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/practice">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    문제 연습 시작하기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <Target className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">틀린 문제 복습</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  이전에 틀린 문제들을 모아서 효율적으로 복습하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/review">
                  <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                    틀린 문제 복습하기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="text-center pb-4">
                <div className="h-16 w-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl text-gray-900">모의시험</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  실제 시험 환경과 동일한 65문제 모의시험에 도전하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/test">
                  <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    모의시험 시작하기
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2">
                  실제 시험과 동일한 65문제 • 정답 즉시 확인 불가
                </p>
              </CardContent>
            </Card>
          </div>


        </div>
      </div>
    </div>
  );
}
