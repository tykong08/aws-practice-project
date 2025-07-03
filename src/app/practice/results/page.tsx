'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Home, RotateCcw } from 'lucide-react';
import { Suspense } from 'react';

function ResultsContent() {
    const searchParams = useSearchParams();
    const correct = parseInt(searchParams.get('correct') || '0');
    const total = parseInt(searchParams.get('total') || '0');

    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreMessage = (percentage: number) => {
        if (percentage >= 90) return '훌륭합니다! 🎉';
        if (percentage >= 80) return '잘했습니다! 👏';
        if (percentage >= 70) return '좋은 점수입니다! 👍';
        if (percentage >= 60) return '괜찮은 점수입니다 📚';
        return '더 열심히 공부해보세요! 💪';
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="text-center border border-gray-200">
                        <CardHeader>
                            <div className="mx-auto mb-4">
                                <Trophy className={`h-16 w-16 ${getScoreColor(percentage)}`} />
                            </div>
                            <CardTitle className="text-3xl mb-2">연습 완료!</CardTitle>
                            <CardDescription className="text-lg">
                                {getScoreMessage(percentage)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Score Display */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className={`text-3xl font-bold ${getScoreColor(percentage)}`}>
                                        {percentage}%
                                    </div>
                                    <div className="text-sm text-gray-600">정답률</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {correct}
                                    </div>
                                    <div className="text-sm text-gray-600">정답</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {total}
                                    </div>
                                    <div className="text-sm text-gray-600">총 문제</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full transition-all duration-1000 ${percentage >= 80 ? 'bg-green-500' :
                                            percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {/* Performance Analysis */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-2">성과 분석</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    {percentage >= 80 && (
                                        <p>✅ AWS SAA-C01 시험에 대한 이해도가 높습니다.</p>
                                    )}
                                    {percentage >= 60 && percentage < 80 && (
                                        <p>📖 조금 더 학습하면 좋은 성과를 낼 수 있을 것 같습니다.</p>
                                    )}
                                    {percentage < 60 && (
                                        <p>📚 기본 개념을 더 공부하시는 것을 추천합니다.</p>
                                    )}
                                    {correct < total && (
                                        <p>🔄 틀린 문제를 복습해보세요.</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/practice" className="block">
                                        <Button variant="outline" className="w-full">
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            다시 연습하기
                                        </Button>
                                    </Link>
                                    <Link href="/review" className="block">
                                        <Button variant="outline" className="w-full">
                                            <Target className="h-4 w-4 mr-2" />
                                            틀린 문제 복습
                                        </Button>
                                    </Link>
                                </div>
                                <Link href="/" className="block">
                                    <Button className="w-full">
                                        <Home className="h-4 w-4 mr-2" />
                                        홈으로 돌아가기
                                    </Button>
                                </Link>
                            </div>

                            {/* Statistics */}
                            {total > 0 && (
                                <div className="text-xs text-gray-500 pt-4 border-t">
                                    <p>이번 연습에서 {total}개의 문제 중 {correct}개를 맞히셨습니다.</p>
                                    <p>계속 연습하여 실력을 향상시켜보세요!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResultsContent />
        </Suspense>
    );
}
