'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Brain, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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

interface User {
    id: string;
    username: string;
    name: string;
}

export default function PracticePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [loadingExplanation, setLoadingExplanation] = useState(false);
    const [loading, setLoading] = useState(false);
    const [practiceStarted, setPracticeStarted] = useState(false);
    const [questionCount, setQuestionCount] = useState(10);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push('/login');
        }
    }, [router]);

    const currentQuestion = questions[currentQuestionIndex];

    // Helper function to get available options for a question
    const getAvailableOptions = (question: Question) => {
        const options = [question.option1, question.option2, question.option3, question.option4];
        if (question.option5) options.push(question.option5);
        if (question.option6) options.push(question.option6);
        return options;
    };

    const startPractice = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/questions/random?count=${questionCount}`);
            if (response.ok) {
                const data = await response.json();
                setQuestions(data);
                setStartTime(new Date());
                setQuestionStartTime(new Date());
                setPracticeStarted(true);
            } else {
                alert('문제를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('문제를 불러오는데 실패했습니다.');
        }
        setLoading(false);
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showResult) return;

        setSelectedAnswers(prev => {
            const maxSelections = currentQuestion?.correctAnswers.length || 1;
            
            if (prev.includes(optionIndex)) {
                // 이미 선택된 답안을 다시 클릭하면 선택 해제
                return prev.filter(ans => ans !== optionIndex);
            } else {
                // 새로운 답안 선택
                if (prev.length >= maxSelections) {
                    // 정답 개수만큼 이미 선택했으면 가장 오래된 선택을 제거하고 새로운 선택 추가
                    return [...prev.slice(1), optionIndex];
                } else {
                    // 정답 개수보다 적게 선택했으면 추가
                    return [...prev, optionIndex];
                }
            }
        });
    };

    const submitAnswer = async () => {
        if (!currentQuestion || selectedAnswers.length === 0 || !user || !questionStartTime) return;

        const isCorrect =
            selectedAnswers.length === currentQuestion.correctAnswers.length &&
            selectedAnswers.every(ans => currentQuestion.correctAnswers.includes(ans));

        const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);

        // Save attempt to database
        try {
            console.log('💾 Saving attempt:', {
                questionId: currentQuestion.id,
                userId: user.id,
                selectedAnswers,
                isCorrect,
                timeSpent,
            });

            const response = await fetch('/api/attempts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: currentQuestion.id,
                    userId: user.id,
                    selectedAnswers,
                    isCorrect,
                    timeSpent,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Failed to save attempt:', errorData);
                throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
            }

            const savedAttempt = await response.json();
            console.log('✅ Attempt saved successfully:', savedAttempt);
        } catch (error) {
            console.error('❌ Error saving attempt:', error);
            // Don't block the UI, but show a warning
            alert('답안 저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }

        setScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1
        }));

        setShowResult(true);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswers([]);
            setShowResult(false);
            setShowExplanation(false);
            setQuestionStartTime(new Date()); // Reset timer for next question
        } else {
            // Practice completed - calculate total time spent
            const totalTimeSpent = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
            router.push(`/practice/results?correct=${score.correct + (isCurrentCorrect() ? 1 : 0)}&total=${questions.length}&timeSpent=${totalTimeSpent}`);
        }
    };

    const generateExplanation = async () => {
        if (!currentQuestion) return;

        setLoadingExplanation(true);
        try {
            const response = await fetch('/api/explanations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionId: currentQuestion.id,
                    question: currentQuestion.question,
                    options: getAvailableOptions(currentQuestion),
                    correctAnswers: currentQuestion.correctAnswers,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setQuestions(prev => prev.map(q =>
                    q.id === currentQuestion.id
                        ? { ...q, explanation: data.explanation, keywords: data.keywords }
                        : q
                ));
                setShowExplanation(true);
            } else {
                alert('설명을 생성하는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            alert('설명을 생성하는데 실패했습니다.');
        }
        setLoadingExplanation(false);
    };

    const isCurrentCorrect = () => {
        if (!currentQuestion) return false;
        return selectedAnswers.length === currentQuestion.correctAnswers.length &&
            selectedAnswers.every(ans => currentQuestion.correctAnswers.includes(ans));
    };

    if (!practiceStarted) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <Link href="/" className="nav-btn-secondary text-decoration-none">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            홈으로 돌아가기
                        </Link>
                    </div>

                    <Card className="max-w-2xl mx-auto border border-gray-200">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl text-gray-900">연습 시작</CardTitle>
                            <CardDescription className="text-gray-600">
                                문제 개수를 입력하고 연습을 시작하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    문제 개수 입력
                                </label>
                                <input
                                    type="number"
                                    value={questionCount || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Prevent leading zeros and only allow positive integers
                                        if (value === '' || /^[1-9]\d*$/.test(value)) {
                                            const numValue = value === '' ? 0 : parseInt(value, 10);
                                            if (numValue <= 100) {
                                                setQuestionCount(numValue);
                                            }
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        // Prevent leading zero by blocking '0' as first character
                                        const target = e.target as HTMLInputElement;
                                        if (target.value === '' && e.key === '0') {
                                            e.preventDefault();
                                        }
                                    }}
                                    min={1}
                                    max={100}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="문제 개수를 입력하세요 (1-100)"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    1개부터 100개까지 선택할 수 있습니다
                                </p>
                            </div>
                            <Button
                                onClick={startPractice}
                                disabled={loading || questionCount < 1 || questionCount > 100}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        문제 불러오는 중...
                                    </>
                                ) : (
                                    '연습 시작하기'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Card className="border border-gray-200">
                    <CardContent className="p-6">
                        <p className="text-gray-600">문제를 불러오는 중...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link href="/" className="nav-btn-secondary text-decoration-none">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        홈으로 돌아가기
                    </Link>
                    <div className="text-sm text-gray-600">
                        {currentQuestionIndex + 1} / {questions.length}
                    </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <div className="max-w-4xl mx-auto">
                    <Card className="border border-gray-200">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-xl mb-2">
                                        문제 {currentQuestionIndex + 1}
                                    </CardTitle>
                                    <div className="flex gap-2 text-sm text-gray-600 mb-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {currentQuestion.topic}
                                        </span>
                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                            {currentQuestion.difficulty}
                                        </span>
                                        {currentQuestion.correctAnswers.length > 1 && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                                다중 선택
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {showResult && (
                                    <div className="ml-4">
                                        {isCurrentCorrect() ? (
                                            <CheckCircle className="h-8 w-8 text-green-600" />
                                        ) : (
                                            <XCircle className="h-8 w-8 text-red-600" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <CardDescription className="text-base text-gray-800 leading-relaxed">
                                {currentQuestion.question}
                            </CardDescription>
                            {/* 선택 안내 메시지 */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>{currentQuestion.correctAnswers.length}개의 정답</strong>을 선택하세요. 
                                    {selectedAnswers.length}/{currentQuestion.correctAnswers.length} 선택됨
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Options */}
                            <div className="space-y-3">
                                {getAvailableOptions(currentQuestion).map((option, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAnswers.includes(index)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            } ${showResult && currentQuestion.correctAnswers.includes(index)
                                                ? 'border-green-500 bg-green-50'
                                                : ''
                                            } ${showResult && selectedAnswers.includes(index) && !currentQuestion.correctAnswers.includes(index)
                                                ? 'border-red-500 bg-red-50'
                                                : ''
                                            }`}
                                        onClick={() => handleAnswerSelect(index)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={selectedAnswers.includes(index)}
                                            />
                                            <span className="font-medium text-sm text-gray-600">
                                                {index + 1}.
                                            </span>
                                            <span className="text-gray-800">{option}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            {!showResult ? (
                                <Button
                                    onClick={submitAnswer}
                                    disabled={selectedAnswers.length === 0}
                                    className="w-full mt-6"
                                >
                                    답안 제출
                                </Button>
                            ) : (
                                <div className="space-y-4 mt-6">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={generateExplanation}
                                            disabled={loadingExplanation}
                                            className={`ai-explanation-btn flex-1 ${loadingExplanation ? 'ai-explanation-loading' : ''}`}
                                        >
                                            {loadingExplanation ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                    설명 생성 중...
                                                </>
                                            ) : (
                                                <>
                                                    <Brain className="h-4 w-4 mr-2" />
                                                    AI 설명 보기
                                                </>
                                            )}
                                        </button>
                                        <button onClick={nextQuestion} className="nav-btn-primary flex-1">
                                            {currentQuestionIndex < questions.length - 1 ? '다음 문제' : '결과 보기'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Explanation */}
                            {showExplanation && currentQuestion.explanation && (
                                <div className="ai-explanation mt-6">
                                    <h3>상세 해설</h3>
                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-wrap text-gray-700">
                                            {currentQuestion.explanation}
                                        </div>
                                        {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium text-gray-900 mb-2">핵심 키워드</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {currentQuestion.keywords.map((keyword, index) => (
                                                        <span
                                                            key={index}
                                                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                                                        >
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
