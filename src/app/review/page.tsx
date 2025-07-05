'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, CheckCircle, XCircle, RefreshCw, Trash2, Calendar, List, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';

interface Question {
    id: string;
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5?: string;
    option6?: string;
    correctAnswers: number[];
    explanation?: string;
    keywords?: string[];
    topic: string;
    difficulty: string;
}

interface IncorrectAttempt {
    id: string;
    questionId: string;
    selectedAnswers: number[];
    createdAt: string;
    question: Question;
}

interface User {
    id: string;
    username: string;
    name: string;
}

export default function ReviewPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [incorrectAttempts, setIncorrectAttempts] = useState<IncorrectAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
    const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
    const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());
    const [groupByDate, setGroupByDate] = useState(true);
    const [clearingAttempts, setClearingAttempts] = useState(false);

    // Helper function to get available options for a question
    const getAvailableOptions = (question: Question) => {
        const options = [question.option1, question.option2, question.option3, question.option4];
        if (question.option5) options.push(question.option5);
        if (question.option6) options.push(question.option6);
        return options;
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push('/login');
            return;
        }
    }, [router]);

    const fetchIncorrectAttempts = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/attempts/incorrect?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                const processedData = data.map((attempt: IncorrectAttempt) => {
                    return {
                        ...attempt,
                        selectedAnswers: Array.isArray(attempt.selectedAnswers)
                            ? attempt.selectedAnswers.map((ans: string | number) => typeof ans === 'string' ? parseInt(ans, 10) : ans)
                            : [],
                        question: attempt.question ? {
                            ...attempt.question,
                            correctAnswers: Array.isArray(attempt.question.correctAnswers)
                                ? attempt.question.correctAnswers.map((ans: string | number) => typeof ans === 'string' ? parseInt(ans, 10) : ans)
                                : []
                        } : attempt.question
                    };
                });

                setIncorrectAttempts(processedData);
            } else {
                console.error('Failed to fetch incorrect attempts');
            }
        } catch (error) {
            console.error('Error fetching incorrect attempts:', error);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchIncorrectAttempts();
        }
    }, [user, fetchIncorrectAttempts]);

    // 날짜별 보기 활성화 시 모든 날짜를 접힌 상태로 초기화
    useEffect(() => {
        if (groupByDate) {
            // 날짜별 보기에서는 모든 날짜를 접힌 상태로 시작
            setExpandedDates(new Set());
        } else {
            // 날짜별 보기가 비활성화되면 모든 날짜 접기
            setExpandedDates(new Set());
        }
    }, [groupByDate, incorrectAttempts]);

    const toggleQuestion = (questionId: string) => {
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const toggleExplanation = (questionId: string) => {
        setExpandedExplanations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const toggleDate = (date: string) => {
        setExpandedDates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    const toggleAllDates = () => {
        if (!groupByDate || !groupedAttempts) return;

        const allDates = Array.from(groupedAttempts.keys());
        const allExpanded = allDates.every(date => expandedDates.has(date));

        if (allExpanded) {
            // 모두 접기
            setExpandedDates(new Set());
        } else {
            // 모두 펼치기
            setExpandedDates(new Set(allDates));
        }
    };

    const generateExplanation = async (attempt: IncorrectAttempt) => {
        setLoadingExplanations(prev => new Set([...prev, attempt.questionId]));

        try {
            const response = await fetch('/api/explanations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: attempt.questionId,
                    question: attempt.question.question,
                    options: getAvailableOptions(attempt.question),
                    correctAnswers: attempt.question.correctAnswers,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIncorrectAttempts(prev => prev.map(item =>
                    item.questionId === attempt.questionId
                        ? {
                            ...item,
                            question: {
                                ...item.question,
                                explanation: data.explanation,
                                keywords: data.keywords
                            }
                        }
                        : item
                ));
                // 해설이 생성되면 자동으로 펼치기
                setExpandedExplanations(prev => new Set([...prev, attempt.questionId]));
            } else {
                alert('설명을 생성하는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            alert('설명을 생성하는데 실패했습니다.');
        }

        setLoadingExplanations(prev => {
            const newSet = new Set(prev);
            newSet.delete(attempt.questionId);
            return newSet;
        });
    };

    const clearIncorrectAttempts = async () => {
        if (!user) return;

        const confirmed = confirm('모든 틀린 문제 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
        if (!confirmed) return;

        setClearingAttempts(true);
        try {
            const response = await fetch(`/api/attempts/incorrect/clear?userId=${user.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Cleared ${data.deletedCount} incorrect attempts`);
                setIncorrectAttempts([]);
                alert('틀린 문제 기록이 모두 삭제되었습니다.');
            } else {
                const errorData = await response.json();
                console.error('❌ Failed to clear attempts:', errorData);
                alert('틀린 문제 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ Error clearing attempts:', error);
            alert('틀린 문제 삭제 중 오류가 발생했습니다.');
        }
        setClearingAttempts(false);
    };

    // Group attempts by date
    const groupAttemptsByDate = (attempts: IncorrectAttempt[]) => {
        const grouped = new Map<string, IncorrectAttempt[]>();

        attempts.forEach(attempt => {
            const date = new Date(attempt.createdAt).toLocaleDateString('ko-KR');
            if (!grouped.has(date)) {
                grouped.set(date, []);
            }
            grouped.get(date)!.push(attempt);
        });

        // Sort dates in descending order (most recent first)
        return new Map([...grouped.entries()].sort((a, b) => {
            const dateA = new Date(a[0]).getTime();
            const dateB = new Date(b[0]).getTime();
            return dateB - dateA;
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Card className="border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span className="text-gray-600">복습할 문제를 불러오는 중...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const groupedAttempts = groupByDate ? groupAttemptsByDate(incorrectAttempts) : null;

    const renderQuestionCard = (attempt: IncorrectAttempt, index: number) => (
        <Card key={attempt.id} className="overflow-hidden">
            <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleQuestion(attempt.questionId)}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                            문제 {index + 1}
                        </CardTitle>
                        <div className="flex gap-2 text-sm text-gray-600 mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {attempt.question.topic}
                            </span>
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                {attempt.question.difficulty}
                            </span>
                            {attempt.question.correctAnswers.length > 1 && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                    다중 선택
                                </span>
                            )}
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                {new Date(attempt.createdAt).toLocaleDateString('ko-KR')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <XCircle className="h-6 w-6 text-red-600" />
                        {expandedQuestions.has(attempt.questionId) ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </div>
                <CardDescription className="text-left">
                    {attempt.question.question}
                </CardDescription>
            </CardHeader>

            {expandedQuestions.has(attempt.questionId) && (
                <CardContent className="border-t bg-gray-50">
                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {getAvailableOptions(attempt.question).map((option, optionIndex) => (
                            <div
                                key={optionIndex}
                                className={`p-3 border rounded-lg ${attempt.question.correctAnswers.includes(optionIndex)
                                    ? 'border-green-500 bg-green-50'
                                    : attempt.selectedAnswers.includes(optionIndex)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="font-medium text-sm text-gray-600">
                                        {optionIndex + 1}.
                                    </span>
                                    <span className="text-gray-800">{option}</span>
                                    {attempt.question.correctAnswers.includes(optionIndex) && (
                                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                    )}
                                    {attempt.selectedAnswers.includes(optionIndex) &&
                                        !attempt.question.correctAnswers.includes(optionIndex) && (
                                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Answer Summary */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm font-medium text-gray-700">선택한 답:</span>
                                <div className="text-red-600 font-medium">
                                    {attempt.selectedAnswers.map(ans => ans + 1).join(', ')}
                                </div>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-700">정답:</span>
                                <div className="text-green-600 font-medium">
                                    {attempt.question.correctAnswers.map(ans => ans + 1).join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    {attempt.question.explanation ? (
                        <div className="mb-4">
                            <div
                                className="flex items-center justify-between p-3 bg-blue-100 border border-blue-200 rounded-t-lg cursor-pointer hover:bg-blue-150 transition-colors"
                                onClick={() => toggleExplanation(attempt.questionId)}
                            >
                                <h4 className="font-semibold text-blue-900 flex items-center">
                                    설명
                                </h4>
                                {expandedExplanations.has(attempt.questionId) ? (
                                    <ChevronUp className="h-5 w-5 text-blue-600" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-blue-600" />
                                )}
                            </div>
                            {expandedExplanations.has(attempt.questionId) && (
                                <div className="bg-blue-50 border-x border-b border-blue-200 rounded-b-lg p-4">
                                    <p className="text-blue-800 whitespace-pre-wrap">{attempt.question.explanation}</p>
                                    {attempt.question.keywords && attempt.question.keywords.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-sm font-medium text-blue-700">핵심 키워드: </span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {attempt.question.keywords.map((keyword, idx) => (
                                                    <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button
                            onClick={() => generateExplanation(attempt)}
                            disabled={loadingExplanations.has(attempt.questionId)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loadingExplanations.has(attempt.questionId) ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    설명 생성 중...
                                </>
                            ) : (
                                <>
                                    <Brain className="h-4 w-4 mr-2" />
                                    AI 설명 생성하기
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            )}
        </Card>
    );

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        홈으로 돌아가기
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">틀린 문제 복습</h1>
                    <p className="text-gray-600 mt-2">
                        이전에 틀린 문제들을 다시 살펴보고 실력을 향상시키세요
                    </p>
                </div>

                {incorrectAttempts.length === 0 ? (
                    <Card className="max-w-2xl mx-auto text-center">
                        <CardContent className="p-8">
                            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <CardTitle className="text-xl mb-2">모든 문제를 맞히셨습니다!</CardTitle>
                            <CardDescription className="mb-4">
                                틀린 문제가 없습니다. 새로운 문제를 연습해보세요.
                            </CardDescription>
                            <Link href="/practice">
                                <Button>새 문제 연습하기</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Controls */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">
                                총 {incorrectAttempts.length}개의 틀린 문제가 있습니다
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setGroupByDate(!groupByDate)}
                                    className="flex items-center gap-2"
                                >
                                    {groupByDate ? (
                                        <>
                                            <List className="h-4 w-4" />
                                            목록 보기
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="h-4 w-4" />
                                            날짜별 보기
                                        </>
                                    )}
                                </Button>
                                {groupByDate && groupedAttempts && groupedAttempts.size > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllDates}
                                        className="flex items-center gap-2"
                                    >
                                        {Array.from(groupedAttempts.keys()).every(date => expandedDates.has(date)) ? (
                                            <>
                                                <ChevronRight className="h-4 w-4" />
                                                모두 접기
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4" />
                                                모두 펼치기
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearIncorrectAttempts}
                                    disabled={clearingAttempts}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                    {clearingAttempts ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            삭제 중...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            모두 삭제
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Questions */}
                        {groupByDate ? (
                            <div className="space-y-4">
                                {Array.from(groupedAttempts!.entries()).map(([date, attempts]) => (
                                    <div key={date} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div
                                            className="flex items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                            onClick={() => toggleDate(date)}
                                        >
                                            {expandedDates.has(date) ? (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-gray-500" />
                                            )}
                                            <Calendar className="h-5 w-5 text-gray-500" />
                                            <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                                            <span className="text-sm text-gray-500">({attempts.length}개 문제)</span>
                                        </div>
                                        {expandedDates.has(date) && (
                                            <div className="p-4 space-y-4 bg-white">
                                                {attempts.map((attempt, index) => renderQuestionCard(attempt, index))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {incorrectAttempts.map((attempt, index) => renderQuestionCard(attempt, index))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
