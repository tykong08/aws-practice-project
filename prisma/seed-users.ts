import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
    {
        username: 'user1',
        password: 'password123',
        name: 'astra',
    },
    {
        username: 'user2',
        password: 'password123',
        name: 'simon',
    },
    {
        username: 'user3',
        password: 'password123',
        name: 'tommy',
    },
    {
        username: 'user4',
        password: 'password123',
        name: 'tira',
    },
];

const sampleQuestions = [
    {
        question: "회사에서 웹 애플리케이션을 위해 고가용성과 확장성을 제공하는 데이터베이스 솔루션이 필요합니다. 다음 중 가장 적합한 AWS 서비스는 무엇입니까?",
        option1: "Amazon RDS",
        option2: "Amazon DynamoDB",
        option3: "Amazon ElastiCache",
        option4: "Amazon Redshift",
        correctAnswers: "[0,1]",
        difficulty: "medium",
        topic: "Database",
    },
    {
        question: "EC2 인스턴스에서 실행되는 애플리케이션이 S3 버킷에 액세스해야 합니다. 가장 안전한 방법은 무엇입니까?",
        option1: "액세스 키와 시크릿 키를 애플리케이션 코드에 하드코딩",
        option2: "IAM 역할을 생성하고 EC2 인스턴스에 연결",
        option3: "S3 버킷을 퍼블릭으로 설정",
        option4: "VPC 엔드포인트 사용",
        correctAnswers: "[1]",
        difficulty: "medium",
        topic: "Security",
    },
    {
        question: "Auto Scaling 그룹에서 인스턴스를 종료할 때 어떤 정책이 기본적으로 사용됩니까?",
        option1: "가장 오래된 인스턴스 종료",
        option2: "가장 새로운 인스턴스 종료",
        option3: "가장 많은 가용 영역에서 인스턴스 종료",
        option4: "가장 적은 가용 영역에서 인스턴스 종료",
        correctAnswers: "[2]",
        difficulty: "hard",
        topic: "Auto Scaling",
    },
    {
        question: "CloudFront의 주요 이점은 무엇입니까?",
        option1: "콘텐츠 캐싱을 통한 성능 향상",
        option2: "DDoS 보호",
        option3: "SSL/TLS 종료",
        option4: "위의 모든 것",
        correctAnswers: "[3]",
        difficulty: "easy",
        topic: "CloudFront",
    },
    {
        question: "VPC에서 인터넷과 통신하기 위해 필요한 구성 요소는 무엇입니까?",
        option1: "인터넷 게이트웨이",
        option2: "NAT 게이트웨이",
        option3: "VPC 엔드포인트",
        option4: "Direct Connect",
        correctAnswers: "[0]",
        difficulty: "medium",
        topic: "VPC",
    }
];

async function main() {
    console.log('사용자 및 문제 시드 데이터 추가 시작...');

    // Clear existing data
    await prisma.userAttempt.deleteMany();
    await prisma.studySession.deleteMany();
    await prisma.user.deleteMany();
    await prisma.question.deleteMany();

    // Create users
    for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
            },
        });
    }

    // Create questions
    for (const questionData of sampleQuestions) {
        await prisma.question.create({
            data: questionData,
        });
    }

    console.log('시드 데이터 추가 완료!');
    console.log('생성된 사용자:');
    users.forEach(user => {
        console.log(`- ${user.name} (${user.username}) / 비밀번호: ${user.password}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
