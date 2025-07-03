'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

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
    topic: string;
    difficulty: string;
}

export default function ComplexQuestionsTest() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);

    const getAvailableOptions = (question: Question) => {
        const options = [question.option1, question.option2, question.option3, question.option4];
        if (question.option5) options.push(question.option5);
        if (question.option6) options.push(question.option6);
        return options;
    };

    const loadQuestions = async (type: 'many-options' | 'many-answers' | 'complex') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/questions/complex?type=${type}`);
            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions);
                setCurrentIndex(0);
                setSelectedAnswers([]);
                setShowAnswer(false);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
        }
        setLoading(false);
    };

    const handleAnswerSelect = (optionIndex: number) => {
        if (showAnswer) return;

        setSelectedAnswers(prev => {
            if (prev.includes(optionIndex)) {
                return prev.filter(ans => ans !== optionIndex);
            } else {
                return [...prev, optionIndex];
            }
        });
    };

    const currentQuestion = questions[currentIndex];
    const isCorrect = () => {
        if (!currentQuestion) return false;
        return currentQuestion.correctAnswers.length === selectedAnswers.length &&
            currentQuestion.correctAnswers.every(ans => selectedAnswers.includes(ans));
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswers([]);
            setShowAnswer(false);
        }
    };

    const prevQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setSelectedAnswers([]);
            setShowAnswer(false);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">복잡한 문제 테스트</h1>
                    <p className="text-gray-600">5-6개 선지, 다중 정답 문제들을 테스트해보세요</p>
                </div>

                <div className="flex gap-4 mb-8">
                    <Button onClick={() => loadQuestions('many-options')} disabled={loading}>
                        5-6개 선지 문제 ({loading ? '로딩...' : '64개'})
                    </Button>
                    <Button onClick={() => loadQuestions('many-answers')} disabled={loading}>
                        3개 이상 정답 ({loading ? '로딩...' : '6개'})
                    </Button>
                    <Button onClick={() => loadQuestions('complex')} disabled={loading}>
                        복합 문제 (5-6개 선지 + 다중 정답)
                    </Button>
                </div>

                {currentQuestion && (
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <CardTitle className="text-xl mb-2">
                                        문제 {currentIndex + 1} / {questions.length}
                                    </CardTitle>
                                    <div className="flex gap-2 text-sm mb-4">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {currentQuestion.topic}
                                        </span>
                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                            {currentQuestion.difficulty}
                                        </span>
                                        {currentQuestion.correctAnswers.length > 1 && (
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                                다중 선택 ({currentQuestion.correctAnswers.length}개 정답)
                                            </span>
                                        )}
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                            {getAvailableOptions(currentQuestion).length}개 선지
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <CardDescription className="text-base">
                                {currentQuestion.question}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-3 mb-6">
                                {getAvailableOptions(currentQuestion).map((option, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${showAnswer
                                                ? currentQuestion.correctAnswers.includes(index)
                                                    ? 'border-green-500 bg-green-50'
                                                    : selectedAnswers.includes(index)
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 bg-white'
                                                : selectedAnswers.includes(index)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleAnswerSelect(index)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="font-medium text-sm text-gray-600">
                                                {index + 1}.
                                            </span>
                                            <span className="text-gray-800 flex-1">{option}</span>
                                            {showAnswer && currentQuestion.correctAnswers.includes(index) && (
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                            )}
                                            {showAnswer && selectedAnswers.includes(index) &&
                                                !currentQuestion.correctAnswers.includes(index) && (
                                                    <XCircle className="h-5 w-5 text-red-600" />
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {showAnswer && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {isCorrect() ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className="font-medium">
                                            {isCorrect() ? '정답입니다!' : '틀렸습니다.'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div>선택한 답: {selectedAnswers.map(ans => ans + 1).join(', ')}</div>
                                        <div>정답: {currentQuestion.correctAnswers.map(ans => ans + 1).join(', ')}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={prevQuestion}
                                        disabled={currentIndex === 0}
                                    >
                                        이전 문제
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={nextQuestion}
                                        disabled={currentIndex === questions.length - 1}
                                    >
                                        다음 문제
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => setShowAnswer(!showAnswer)}
                                    disabled={selectedAnswers.length === 0}
                                >
                                    {showAnswer ? '정답 숨기기' : '정답 확인'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {questions.length === 0 && !loading && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-gray-600">위 버튼을 클릭해서 복잡한 문제들을 불러오세요</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
