'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, Trophy, AlertTriangle } from 'lucide-react';

interface ScoreResult {
    correctCount: number;
    total: number;
    percentage: number;
    estimatedScore: string;
    evaluation: string;
    status: 'pass' | 'borderline' | 'fail';
}

function TestResultsContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<ScoreResult | null>(null);

    useEffect(() => {
        const correct = parseInt(searchParams.get('correct') || '0');
        const total = parseInt(searchParams.get('total') || '65');

        const percentage = (correct / total) * 100;
        let estimatedScore = '';
        let evaluation = '';
        let status: 'pass' | 'borderline' | 'fail' = 'fail';

        // 점수 기준에 따른 평가
        if (correct >= 50) {
            estimatedScore = '750~850점 예상';
            evaluation = '안정권 합격';
            status = 'pass';
        } else if (correct >= 45) {
            estimatedScore = '720점 이상';
            evaluation = '합격 가능';
            status = 'borderline';
        } else {
            estimatedScore = '700점 미만';
            evaluation = '불합격 가능성 높음';
            status = 'fail';
        }

        setResult({
            correctCount: correct,
            total,
            percentage: Math.round(percentage * 10) / 10,
            estimatedScore,
            evaluation,
            status
        });
    }, [searchParams]);

    if (!result) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">결과를 불러오고 있습니다...</div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}시간 ${minutes}분 ${secs}초`;
    };

    const timeSpent = parseInt(searchParams.get('timeSpent') || '0');

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        홈으로 돌아가기
                    </Link>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            AWS SAA-C03 모의시험 결과
                        </h1>
                        <p className="text-gray-600">
                            시험이 완료되었습니다. 아래에서 결과를 확인하세요.
                        </p>
                    </div>

                    {/* Main Result Card */}
                    <Card className={`border-2 mb-8 ${result.status === 'pass' ? 'border-green-200 bg-green-50' :
                            result.status === 'borderline' ? 'border-yellow-200 bg-yellow-50' :
                                'border-red-200 bg-red-50'
                        }`}>
                        <CardHeader className="text-center pb-4">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${result.status === 'pass' ? 'bg-green-100' :
                                    result.status === 'borderline' ? 'bg-yellow-100' :
                                        'bg-red-100'
                                }`}>
                                {result.status === 'pass' ? (
                                    <Trophy className="h-8 w-8 text-green-600" />
                                ) : result.status === 'borderline' ? (
                                    <CheckCircle className="h-8 w-8 text-yellow-600" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                )}
                            </div>
                            <CardTitle className={`text-2xl ${result.status === 'pass' ? 'text-green-900' :
                                    result.status === 'borderline' ? 'text-yellow-900' :
                                        'text-red-900'
                                }`}>
                                {result.evaluation}
                            </CardTitle>
                            <CardDescription className={`text-lg ${result.status === 'pass' ? 'text-green-700' :
                                    result.status === 'borderline' ? 'text-yellow-700' :
                                        'text-red-700'
                                }`}>
                                {result.estimatedScore}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Detailed Results */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <Card className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-900">점수 상세</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">정답 개수</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {result.correctCount}개
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">오답 개수</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {result.total - result.correctCount}개
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">정답률</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {result.percentage}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">총 문제 수</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {result.total}문제
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-900">시험 정보</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">소요 시간</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {formatTime(timeSpent)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">시험 유형</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        모의시험 (65문제)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">완료 일시</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {new Date().toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Score Guide */}
                    <Card className="border border-gray-200 mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl text-gray-900">점수 기준표</CardTitle>
                            <CardDescription>AWS SAA-C03 시험 합격 기준 참고</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">정답 개수</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">정답률</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">예상 점수</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">평가</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className={`border-b ${result.correctCount >= 50 ? 'bg-green-50' : ''}`}>
                                            <td className="py-2 px-3">50문항 이상</td>
                                            <td className="py-2 px-3">약 77% 이상</td>
                                            <td className="py-2 px-3">750~850점 예상</td>
                                            <td className="py-2 px-3 text-green-600 font-semibold">안정권 합격</td>
                                        </tr>
                                        <tr className={`border-b ${result.correctCount >= 45 && result.correctCount < 50 ? 'bg-yellow-50' : ''}`}>
                                            <td className="py-2 px-3">45문항 이상</td>
                                            <td className="py-2 px-3">약 70% 이상</td>
                                            <td className="py-2 px-3">720점 이상</td>
                                            <td className="py-2 px-3 text-yellow-600 font-semibold">합격 가능</td>
                                        </tr>
                                        <tr className={`${result.correctCount < 45 ? 'bg-red-50' : ''}`}>
                                            <td className="py-2 px-3">44문항 이하</td>
                                            <td className="py-2 px-3">70% 미만</td>
                                            <td className="py-2 px-3">700점 미만</td>
                                            <td className="py-2 px-3 text-red-600 font-semibold">불합격 가능성 높음</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/test">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                다시 시험보기
                            </Button>
                        </Link>
                        <Link href="/practice">
                            <Button variant="outline" className="border-gray-300">
                                문제 연습하기
                            </Button>
                        </Link>
                        <Link href="/review">
                            <Button variant="outline" className="border-gray-300">
                                틀린 문제 복습
                            </Button>
                        </Link>
                    </div>

                    {/* Additional Tips */}
                    <Card className="border border-gray-200 mt-8">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-900">학습 권장사항</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-700">
                                {result.status === 'pass' && (
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <p>훌륭한 성과입니다! 실제 시험에서도 좋은 결과를 기대할 수 있습니다. 꾸준한 복습을 통해 실력을 유지하세요.</p>
                                    </div>
                                )}
                                {result.status === 'borderline' && (
                                    <div className="flex items-start space-x-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <p>합격 가능한 수준입니다. 틀린 문제들을 중심으로 추가 학습하여 안정권 진입을 목표로 하세요.</p>
                                    </div>
                                )}
                                {result.status === 'fail' && (
                                    <div className="flex items-start space-x-2">
                                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p>추가 학습이 필요합니다. 기본 개념을 다시 정리하고, 문제 연습을 통해 실력을 향상시키세요.</p>
                                    </div>
                                )}
                                <div className="flex items-start space-x-2">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    <p>틀린 문제 복습 기능을 활용하여 약점을 보완하세요.</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    <p>정기적인 모의시험을 통해 실전 감각을 유지하세요.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function TestResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">결과를 불러오고 있습니다...</div>
            </div>
        }>
            <TestResultsContent />
        </Suspense>
    );
}
