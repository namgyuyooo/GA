# 🚀 Deployment Guide

이 가이드는 UTM Analytics Dashboard를 Vercel에 배포하는 방법을 상세히 설명합니다.

## 📋 사전 준비사항

### 1. 필수 계정 생성

- [GitHub](https://github.com) 계정
- [Vercel](https://vercel.com) 계정
- [Google Cloud Console](https://console.cloud.google.com) 프로젝트

### 2. Google Cloud 설정

#### Google Analytics & Search Console API 설정

```bash
# 1. Google Cloud Console에서 새 프로젝트 생성
# 2. 다음 API들을 활성화:
#    - Google Analytics Data API
#    - Google Search Console API
```

#### 서비스 계정 생성

```bash
# 1. IAM & Admin > Service Accounts
# 2. Create Service Account
# 3. JSON key 다운로드
# 4. GA4와 Search Console에 서비스 계정 이메일 추가 (Viewer 권한)
```

#### OAuth 2.0 설정

```bash
# 1. APIs & Services > Credentials
# 2. Create OAuth 2.0 Client ID
# 3. Authorized redirect URIs 추가:
#    - http://localhost:3000/api/auth/callback/google (개발용)
#    - https://your-domain.vercel.app/api/auth/callback/google (프로덕션용)
```

## 🔧 GitHub 저장소 설정

### 1. 저장소 생성 및 코드 푸시

```bash
# 로컬에서 git 초기화
git init
git add .
git commit -m "Initial commit: UTM Analytics Dashboard"

# GitHub에 저장소 생성 후
git remote add origin https://github.com/yourusername/utm-analytics-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Repository Secrets 설정

GitHub Repository > Settings > Secrets and variables > Actions에서 다음 시크릿들을 추가:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## 🌐 Vercel 배포

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 생성
vercel
```

### 2. 데이터베이스 설정

```bash
# Vercel 대시보드에서:
# 1. Storage > Create Database > Postgres
# 2. 데이터베이스 생성 후 CONNECTION_STRING 복사
```

### 3. 환경 변수 설정

Vercel 대시보드 > Project > Settings > Environment Variables에서 설정:

#### 필수 환경 변수

```bash
# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-vercel-postgres-connection-string

# Google APIs
GA4_PROPERTY_ID=your-ga4-property-id
GSC_SITE_URL=https://your-website.com
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Slack (선택사항)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Email (선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 환경별 설정

- **Development**: 로컬 개발용
- **Preview**: PR 미리보기용
- **Production**: 프로덕션용

### 4. 데이터베이스 마이그레이션

```bash
# 로컬에서 환경 변수 가져오기
vercel env pull .env.local

# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push
```

### 5. 배포 실행

```bash
# 프로덕션 배포
vercel --prod
```

## 📊 배포 후 설정

### 1. Google Analytics 연동 확인

```bash
# 1. GA4에서 실시간 보고서 확인
# 2. 서비스 계정 권한 확인
# 3. API 호출 테스트
```

### 2. Search Console 연동 확인

```bash
# 1. Search Console에서 사이트 확인
# 2. 서비스 계정 권한 확인
# 3. API 호출 테스트
```

### 3. Slack 연동 설정 (선택사항)

```bash
# 1. Slack 워크스페이스에서 앱 생성
# 2. Incoming Webhooks 활성화
# 3. 알림 테스트
```

## 🔄 자동화 설정

### 1. Vercel Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-report",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### 2. GitHub Actions

자동으로 다음이 실행됩니다:

- PR 생성 시: 린트, 테스트, 미리보기 배포
- main 브랜치 푸시 시: 프로덕션 배포

## 🛠 트러블슈팅

### 일반적인 문제들

#### 1. 데이터베이스 연결 오류

```bash
# 해결방법:
# 1. DATABASE_URL 환경 변수 확인
# 2. Vercel Postgres 연결 상태 확인
# 3. npx prisma db push 재실행
```

#### 2. Google API 인증 오류

```bash
# 해결방법:
# 1. 서비스 계정 키 JSON 형식 확인
# 2. GA4/GSC 권한 확인
# 3. API 활성화 상태 확인
```

#### 3. NextAuth 세션 오류

```bash
# 해결방법:
# 1. NEXTAUTH_SECRET 환경 변수 확인
# 2. NEXTAUTH_URL 도메인 확인
# 3. Google OAuth 리디렉션 URL 확인
```

#### 4. 빌드 오류

```bash
# 해결방법:
# 1. TypeScript 타입 오류 수정
# 2. ESLint 오류 수정
# 3. 의존성 업데이트: npm update
```

### 로그 확인 방법

```bash
# Vercel 함수 로그
vercel logs

# 실시간 로그 모니터링
vercel logs --follow

# 특정 배포 로그
vercel logs --url https://your-app.vercel.app
```

## 📈 성능 최적화

### 1. 이미지 최적화

```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### 2. 캐싱 전략

```typescript
// API 응답 캐싱
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
```

### 3. 번들 크기 최적화

```bash
# 번들 분석
npm run build
npx @next/bundle-analyzer
```

## 🔒 보안 설정

### 1. 환경 변수 보안

- 민감한 정보는 반드시 환경 변수로 관리
- `.env` 파일은 절대 커밋하지 않음
- 프로덕션과 개발 환경 분리

### 2. API 보안

```typescript
// Rate limiting 적용
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous'

  try {
    await rateLimit.check(10, ip) // 10 requests per minute
  } catch {
    return new Response('Too Many Requests', { status: 429 })
  }

  // API 로직...
}
```

### 3. CORS 설정

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  return response
}
```

## 📊 모니터링

### 1. Vercel Analytics

```bash
# package.json에 추가
"@vercel/analytics": "^1.0.0"
```

### 2. 에러 모니터링

```bash
# Sentry 설정 (선택사항)
npm install @sentry/nextjs
```

### 3. 성능 모니터링

- Vercel Speed Insights 활성화
- Core Web Vitals 모니터링
- API 응답 시간 추적

---

## 🎉 배포 완료!

배포가 성공적으로 완료되면:

1. `https://your-app.vercel.app`에서 애플리케이션 확인
2. Google OAuth 로그인 테스트
3. UTM 빌더 기능 테스트
4. 주간 보고서 생성 테스트
5. Slack 알림 테스트

문제가 발생하면 [Issues](https://github.com/yourusername/utm-analytics-dashboard/issues)에 보고해 주세요!
