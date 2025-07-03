import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function generateExplanation(question: string, options: string[], correctAnswers: number[]): Promise<{ explanation: string; keywords: string[] }> {
    try {
        // Check if API key is valid
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here' || process.env.OPENAI_API_KEY.length < 40) {
            return {
                explanation: "AI 설명 기능을 사용하려면 유효한 OpenAI API 키가 필요합니다. 관리자에게 문의해주세요.",
                keywords: ["AWS", "SAA-C03"]
            };
        }

        const prompt = `
다음은 AWS SAA-C03 시험 문제입니다:

문제: ${question}

선택지:
${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}

정답: ${correctAnswers.map(ans => ans + 1).join(', ')}번

이 문제에 대한 상세한 설명을 한국어로 제공해주세요. 다음 형식으로 답변해주세요:

1. 정답 선지가 맞는 이유에 대한 상세한 설명
2. 각 오답 선지가 틀린 이유와 정답과의 차이점

설명은 명확하고 이해하기 쉽게 작성해주세요.
`;

        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: "당신은 AWS 솔루션 아키텍트 어소시에이트 시험 전문가입니다. 명확하고 이해하기 쉬운 한국어로 설명해주세요. 정답과 오답을 명확히 구분할 수 있는 핵심 포인트를 강조해주세요."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || '';

        // Extract keywords from the response (this is a simple implementation)
        const keywordPrompt = `다음 AWS SAA-C03 문제에서 정답 선지와 오답 선지를 구분할 수 있는 핵심 키워드 3-5개를 JSON 배열 형태로만 제공해주세요.

문제: ${question}

정답: ${correctAnswers.map(ans => ans + 1).join(', ')}번 - ${correctAnswers.map(ans => options[ans]).join(', ')}

오답들: ${Array.from({ length: options.length }, (_, i) => i).filter(i => !correctAnswers.includes(i)).map(i => `${i + 1}번 - ${options[i]}`).join(' / ')}

정답을 외울 때 정답과 오답을 명확히 구분할 수 있는 키워드들을 추출해주세요.
예시: ["고가용성", "Multi-AZ", "자동 백업", "읽기 전용 복제본", "RDS"]

키워드만 JSON 배열로 답변해주세요:`;

        const keywordResponse = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: "당신은 AWS 시험 문제 분석 전문가입니다. 정답과 오답을 구분하는 핵심 키워드만 정확히 추출해주세요."
                },
                {
                    role: "user",
                    content: keywordPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: 100,
        });

        let keywords: string[] = [];
        try {
            const keywordContent = keywordResponse.choices[0]?.message?.content || '[]';
            // Remove markdown formatting if present
            const cleanContent = keywordContent
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            keywords = JSON.parse(cleanContent);
        } catch (error) {
            console.error('Failed to parse keywords:', error);
            keywords = ['AWS', 'Cloud Architecture'];
        }

        return {
            explanation: content,
            keywords
        };
    } catch (error) {
        console.error('Error generating explanation:', error);
        throw new Error('Failed to generate explanation');
    }
}
