'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            } else {
                setError(data.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('로그인 중 오류가 발생했습니다.');
        }
        setLoading(false);
    };

    const demoUsers = [
        { username: 'user1', name: 'astra' },
        { username: 'user2', name: 'simon' },
        { username: 'user3', name: 'tommy' },
        { username: 'user4', name: 'tira' },
    ];

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="border border-gray-200">
                    <CardHeader className="text-center">
                        <LogIn className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <CardTitle className="text-2xl text-gray-900">로그인</CardTitle>
                        <CardDescription className="text-gray-600">
                            AWS SAA-C03 연습 사이트에 로그인하세요
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    사용자명
                                </label>
                                <input
                                    type="text"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    required
                                    placeholder="사용자명을 입력하세요"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    required
                                    placeholder="비밀번호를 입력하세요"
                                />
                            </div>
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {loading ? '로그인 중...' : '로그인'}
                            </Button>
                        </form>

                        {/* Demo Users */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">데모 사용자</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {demoUsers.map((user) => (
                                    <Button
                                        key={user.username}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCredentials({ username: user.username, password: 'password123' })}
                                        className="text-xs text-gray-700 border-gray-300"
                                    >
                                        {user.name}
                                    </Button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                모든 데모 사용자의 비밀번호: password123
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
