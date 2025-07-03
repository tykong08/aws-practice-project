'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Save, Trash2, RefreshCw } from 'lucide-react';

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
    difficulty: string;
    topic: string;
    createdAt: string;
}

interface User {
    id: string;
    username: string;
    name: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        option5: '',
        option6: '',
        correctAnswers: [] as number[],
        difficulty: 'medium',
        topic: ''
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            fetchQuestions();
        } else {
            router.push('/login');
        }
    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">로딩 중...</div>
            </div>
        );
    }

    const fetchQuestions = async () => {
        try {
            const response = await fetch('/api/questions');
            if (response.ok) {
                const data = await response.json();
                setQuestions(data);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
        setLoading(false);
    };

    const handleCorrectAnswerToggle = (optionIndex: number) => {
        setFormData(prev => ({
            ...prev,
            correctAnswers: prev.correctAnswers.includes(optionIndex)
                ? prev.correctAnswers.filter(ans => ans !== optionIndex)
                : [...prev.correctAnswers, optionIndex]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.correctAnswers.length === 0) {
            alert('최소 하나의 정답을 선택해주세요.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const newQuestion = await response.json();
                setQuestions(prev => [newQuestion, ...prev]);
                setFormData({
                    question: '',
                    option1: '',
                    option2: '',
                    option3: '',
                    option4: '',
                    option5: '',
                    option6: '',
                    correctAnswers: [],
                    difficulty: 'medium',
                    topic: ''
                });
                setShowForm(false);
                alert('문제가 성공적으로 추가되었습니다.');
            } else {
                alert('문제 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error adding question:', error);
            alert('문제 추가에 실패했습니다.');
        }
        setSaving(false);
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('정말로 이 문제를 삭제하시겠습니까?')) return;

        try {
            const response = await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setQuestions(prev => prev.filter(q => q.id !== questionId));
                alert('문제가 삭제되었습니다.');
            } else {
                alert('문제 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            alert('문제 삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Card className="border border-gray-200">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span className="text-gray-600">문제를 불러오는 중...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        홈으로 돌아가기
                    </Link>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">문제 관리</h1>
                            <p className="text-gray-600 mt-2">
                                AWS SAA-C01 연습 문제를 추가하고 관리하세요
                            </p>
                        </div>
                        <Button onClick={() => setShowForm(!showForm)}>
                            <Plus className="h-4 w-4 mr-2" />
                            새 문제 추가
                        </Button>
                    </div>
                </div>

                {/* Add Question Form */}
                {showForm && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>새 문제 추가</CardTitle>
                            <CardDescription>
                                AWS SAA-C01 연습용 새 문제를 추가하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        문제 내용 *
                                    </label>
                                    <textarea
                                        value={formData.question}
                                        onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-md"
                                        rows={3}
                                        required
                                        placeholder="AWS SAA-C01 문제를 입력하세요..."
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 1 *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option1}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option1: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 2 *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option2}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option2: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 3 *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option3}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option3: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 4 *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option4}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option4: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 5 (선택사항)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option5}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option5: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="5지선다인 경우에만 입력"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            선택지 6 (선택사항)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.option6}
                                            onChange={(e) => setFormData(prev => ({ ...prev, option6: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="6지선다인 경우에만 입력"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        정답 선택 * (복수 선택 가능)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: '선택지 1', enabled: true },
                                            { label: '선택지 2', enabled: true },
                                            { label: '선택지 3', enabled: true },
                                            { label: '선택지 4', enabled: true },
                                            { label: '선택지 5', enabled: formData.option5.trim() !== '' },
                                            { label: '선택지 6', enabled: formData.option6.trim() !== '' }
                                        ].map((option, index) => (
                                            option.enabled && (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        checked={formData.correctAnswers.includes(index)}
                                                        onCheckedChange={() => handleCorrectAnswerToggle(index)}
                                                    />
                                                    <span>{option.label}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            주제 *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.topic}
                                            onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            required
                                            placeholder="예: EC2, S3, VPC..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            난이도
                                        </label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="easy">쉬움</option>
                                            <option value="medium">보통</option>
                                            <option value="hard">어려움</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                저장 중...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                문제 저장
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                    >
                                        취소
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">등록된 문제 ({questions.length}개)</h2>
                    </div>

                    {questions.length === 0 ? (
                        <Card className="text-center">
                            <CardContent className="p-8">
                                <p className="text-gray-600">등록된 문제가 없습니다.</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    새 문제를 추가해보세요.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        questions.map((question, index) => (
                            <Card key={question.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">
                                                문제 {index + 1}
                                            </CardTitle>
                                            <div className="flex gap-2 text-sm text-gray-600 mt-2">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {question.topic}
                                                </span>
                                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                    {question.difficulty}
                                                </span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                    정답: {question.correctAnswers.map(ans => ans + 1).join(', ')}번
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(question.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardDescription className="text-left">
                                        {question.question}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                                        <div className={question.correctAnswers.includes(0) ? 'font-medium text-green-700' : ''}>
                                            1. {question.option1}
                                        </div>
                                        <div className={question.correctAnswers.includes(1) ? 'font-medium text-green-700' : ''}>
                                            2. {question.option2}
                                        </div>
                                        <div className={question.correctAnswers.includes(2) ? 'font-medium text-green-700' : ''}>
                                            3. {question.option3}
                                        </div>
                                        <div className={question.correctAnswers.includes(3) ? 'font-medium text-green-700' : ''}>
                                            4. {question.option4}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
