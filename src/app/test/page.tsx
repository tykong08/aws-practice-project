'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
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

interface TestAnswer {
    questionId: string;
    selectedAnswers: number[];
}

export default function TestPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<TestAnswer[]>([]);
    const [loading, setLoading] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState(130 * 60); // 130분을 초로 변환
    const [timeExpired, setTimeExpired] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            router.push('/login');
        }
    }, [router]);

    // 타이머 useEffect
    useEffect(() => {
        if (!testStarted || timeExpired) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimeExpired(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [testStarted, timeExpired]);

    // 시간 만료 시 자동 제출 처리
    useEffect(() => {
        if (timeExpired) {
            finishTest();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeExpired]);

    // 시간 포맷팅 함수
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];

    // Helper function to get available options for a question
    const getAvailableOptions = (question: Question) => {
        const options = [question.option1, question.option2, question.option3, question.option4];
        if (question.option5) options.push(question.option5);
        if (question.option6) options.push(question.option6);
        return options;
    };
    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

    const startTest = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/questions/random?count=65');
            if (response.ok) {
                const data = await response.json();
                setQuestions(data);
                setStartTime(new Date());
                setTestStarted(true);
                // Initialize answers array
                setAnswers(data.map((q: Question) => ({ questionId: q.id, selectedAnswers: [] })));
            } else {
                alert('문제를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error starting test:', error);
            alert('문제를 불러오는데 실패했습니다.');
        }
        setLoading(false);
    };

    const handleAnswerChange = (optionIndex: number, checked: boolean) => {
        setAnswers(prev => prev.map(answer => {
            if (answer.questionId === currentQuestion.id) {
                const maxSelections = currentQuestion.correctAnswers.length;

                if (checked) {
                    // 새로운 답안 선택
                    if (answer.selectedAnswers.length >= maxSelections) {
                        // 정답 개수만큼 이미 선택했으면 가장 오래된 선택을 제거하고 새로운 선택 추가
                        const newAnswers = [...answer.selectedAnswers.slice(1), optionIndex].sort();
                        return {
                            ...answer,
                            selectedAnswers: newAnswers
                        };
                    } else {
                        // 정답 개수보다 적게 선택했으면 추가
                        return {
                            ...answer,
                            selectedAnswers: [...answer.selectedAnswers, optionIndex].sort()
                        };
                    }
                } else {
                    return {
                        ...answer,
                        selectedAnswers: answer.selectedAnswers.filter(ans => ans !== optionIndex)
                    };
                }
            }
            return answer;
        }));
    };

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const finishTest = async () => {
        if (!user || !startTime) return;

        // Calculate results
        let correctCount = 0;
        const detailedResults = questions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect =
                userAnswer.selectedAnswers.length === question.correctAnswers.length &&
                userAnswer.selectedAnswers.every(ans => question.correctAnswers.includes(ans));

            if (isCorrect) correctCount++;

            return {
                question,
                userAnswer: userAnswer.selectedAnswers,
                correctAnswer: question.correctAnswers,
                isCorrect
            };
        });

        const totalTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

        // Save test session
        try {
            await fetch('/api/test-sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    totalQuestions: questions.length,
                    correctAnswers: correctCount,
                    incorrectAnswers: questions.length - correctCount,
                    timeSpent: totalTime,
                    results: detailedResults
                }),
            });
        } catch (error) {
            console.error('Error saving test session:', error);
        }

        // Navigate to results
        router.push(`/test/results?correct=${correctCount}&total=${questions.length}&timeSpent=${totalTime}`);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">로딩 중...</div>
            </div>
        );
    }

    if (!testStarted) {
        return (
            <div className="min-h-screen bg-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            홈으로 돌아가기
                        </Link>
                    </div>

                    <Card className="max-w-2xl mx-auto border border-gray-200">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl text-gray-900">AWS SAA-C03 모의시험</CardTitle>
                            <CardDescription className="text-gray-600">
                                실제 시험과 동일한 조건으로 65문제를 풀어보세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-900 mb-2">시험 안내</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• 총 65문제로 구성되어 있습니다</li>
                                    <li>• <strong>시간 제한: 130분 (2시간 10분)</strong></li>
                                    <li>• 시간이 만료되면 자동으로 시험이 종료됩니다</li>
                                    <li>• 각 문제를 풀고 나서 정답을 즉시 확인할 수 없습니다</li>
                                    <li>• 모든 문제를 완료한 후 점수와 결과를 확인할 수 있습니다</li>
                                    <li>• 시험 중 페이지를 새로고침하면 진행상황이 사라집니다</li>
                                </ul>
                            </div>
                            <Button
                                onClick={startTest}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                            >
                                {loading ? '문제 불러오는 중...' : '모의시험 시작하기'}
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
                        <p className="text-gray-600">문제를 불러오고 있습니다...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const answeredCount = answers.filter(a => a.selectedAnswers.length > 0).length;

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">AWS SAA-C03 모의시험</h1>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-600">남은 시간</div>
                                <div className={`text-xl font-mono font-bold ${timeLeft < 1800 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                완료: {answeredCount}/{questions.length}문제
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question Navigation */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                        {questions.map((_, index) => {
                            const isAnswered = answers[index].selectedAnswers.length > 0;
                            const isCurrent = index === currentQuestionIndex;
                            return (
                                <button
                                    key={index}
                                    onClick={() => goToQuestion(index)}
                                    className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${isCurrent
                                        ? 'bg-blue-600 text-white'
                                        : isAnswered
                                            ? 'bg-green-100 text-green-800 border border-green-300'
                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Question */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="border border-gray-200">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg">
                                        문제 {currentQuestionIndex + 1}
                                    </CardTitle>
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-500">
                                            {currentQuestion.topic} • {currentQuestion.difficulty}
                                        </span>
                                        {currentQuestion.correctAnswers.length > 1 && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                                다중 선택
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {currentQuestion.question}
                                </p>

                                {/* 선택 안내 메시지 */}
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>{currentQuestion.correctAnswers.length}개의 정답</strong>을 선택하세요.
                                        {currentAnswer?.selectedAnswers.length || 0}/{currentQuestion.correctAnswers.length} 선택됨
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {getAvailableOptions(currentQuestion).map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Checkbox
                                                id={`option-${index}`}
                                                checked={currentAnswer?.selectedAnswers.includes(index) || false}
                                                onCheckedChange={(checked) => handleAnswerChange(index, checked as boolean)}
                                            />
                                            <label
                                                htmlFor={`option-${index}`}
                                                className="text-gray-900 cursor-pointer flex-1"
                                            >
                                                <span className="font-medium mr-2">
                                                    {index + 1}.
                                                </span>
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button
                                        onClick={previousQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        variant="outline"
                                        className="border-gray-300"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        이전 문제
                                    </Button>

                                    {currentQuestionIndex === questions.length - 1 ? (
                                        <Button
                                            onClick={finishTest}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            시험 완료
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={nextQuestion}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            다음 문제
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Side Panel */}
                    <div>
                        <Card className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-lg">시험 진행상황</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">남은 시간</div>
                                    <div className={`text-2xl font-mono font-bold ${timeLeft < 1800 ? 'text-red-600' : 'text-blue-600'}`}>
                                        {formatTime(timeLeft)}
                                    </div>
                                    {timeLeft < 1800 && (
                                        <div className="text-xs text-red-600 mt-1">
                                            30분 미만 남았습니다
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="text-sm text-gray-600 mb-1">답변 완료</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {answeredCount}/{questions.length}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-sm text-gray-600 mb-1">현재 문제</div>
                                    <div className="text-lg font-semibold text-blue-600">
                                        {currentQuestionIndex + 1}번
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={finishTest}
                                        variant="outline"
                                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                                        disabled={answeredCount === 0}
                                    >
                                        시험 완료하기
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        미완료 문제가 있어도 시험을 완료할 수 있습니다
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
