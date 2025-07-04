# RTM Analytics Dashboard

제조업 B2B 마케팅 분석을 위한 종합 대시보드입니다. Google Analytics 4와 Google Search Console 데이터를 활용하여 UTM 캠페인, 검색어 코호트, 사용자 여정을 분석하고 AI 인사이트를 제공합니다.

## 🚀 주요 기능

### 📊 **마케팅 분석**
- **UTM 캠페인 관리**: UTM 빌더, 캠페인 성과 분석, 코호트 분석
- **검색어 분석**: 키워드 코호트 분석, Google Trends 연동
- **트래픽 소스 분석**: 유입 경로별 성과 측정
- **사용자 여정 분석**: 페이지 전환, 체류시간, 스크롤 깊이 분석

### 🤖 **AI 인사이트**
- **Gemini AI 연동**: 10년차 제조 B2B 전문가 관점의 분석
- **주간 보고서**: 자동화된 주간 성과 리포트
- **트렌드 심리학**: 사용자 행동 패턴 분석

### 🔐 **내부 인증 시스템**
- **JWT 기반 인증**: 쿠키를 통한 안전한 세션 관리
- **권한 관리**: SUPER_ADMIN, ADMIN, USER 3단계 권한
- **슈퍼유저 관리**: 환경변수 기반 관리자 계정

### 📈 **데이터 관리**
- **실시간/DB 모드**: 실시간 API 호출 또는 저장된 데이터 활용
- **일괄 데이터 로드**: 대량 데이터 배치 처리
- **PostgreSQL 저장소**: Supabase를 통한 확장 가능한 데이터베이스

## 🛠️ 기술 스택

### **Frontend**
- **Next.js 14**: App Router, Server Components
- **TypeScript**: 타입 안전성
- **TailwindCSS**: 유틸리티 기반 스타일링
- **Chart.js**: 데이터 시각화
- **Heroicons**: 아이콘 시스템

### **Backend**
- **Next.js API Routes**: RESTful API
- **Prisma ORM**: 데이터베이스 ORM
- **PostgreSQL**: 메인 데이터베이스 (Supabase)
- **JWT**: 인증 토큰
- **bcryptjs**: 비밀번호 암호화

### **External APIs**
- **Google Analytics 4**: 웹사이트 분석 데이터
- **Google Search Console**: 검색 성과 데이터
- **Google Trends**: 키워드 트렌드 분석
- **Gemini AI**: 마케팅 인사이트 생성

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd utm-analytics-dashboard
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.example`을 참고하여 `.env.local` 파일을 생성하고 필요한 값들을 설정합니다.

```bash
cp .env.example .env.local
```

### 4. 데이터베이스 설정
```bash
npx prisma generate
npx prisma db push
```

### 5. 개발 서버 실행
```bash
npm run dev
```

## 🔧 환경 변수 설정

### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`

### Google Analytics & Search Console API
1. Google Analytics Data API 활성화
2. Search Console API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. GA4 속성과 Search Console에 서비스 계정 권한 부여

### Slack 웹훅
1. Slack 워크스페이스에서 앱 생성
2. Incoming Webhooks 활성화
3. 웹훅 URL 복사

## 🚀 Vercel 배포

### 1. Vercel에 프로젝트 연결
```bash
npm i -g vercel
vercel login
vercel
```

### 2. 환경 변수 설정
Vercel 대시보드에서 Environment Variables 설정:
- `NEXTAUTH_URL`: 배포된 도메인
- `NEXTAUTH_SECRET`: 랜덤 문자열
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 시크릿
- `DATABASE_URL`: Vercel Postgres 연결 문자열
- 기타 필요한 환경 변수들

### 3. 데이터베이스 설정
```bash
# Vercel Postgres 생성 후
vercel env pull .env.local
npx prisma generate
npx prisma db push
```

### 4. 배포
```bash
vercel --prod
```

## 📋 주요 API 엔드포인트

### UTM 관리
- `GET /api/utm/campaigns` - 캠페인 목록 조회
- `POST /api/utm/campaigns` - 새 캠페인 생성
- `PATCH /api/utm/campaigns/[id]` - 캠페인 상태 업데이트
- `DELETE /api/utm/campaigns/[id]` - 캠페인 삭제

### 분석 & 보고서
- `GET /api/analytics/dashboard` - 대시보드 데이터
- `POST /api/analytics/generate-report` - 수동 보고서 생성
- `GET /api/analytics/weekly-report` - 주간 보고서 조회

### 자동화
- `POST /api/cron/weekly-report` - 주간 보고서 자동 생성 (Vercel Cron)

## 🔄 자동화 스케줄

- **주간 보고서**: 매주 월요일 오전 9시 (KST)
- **Slack 알림**: 보고서 생성 완료 시
- **이상치 탐지**: 성과 급변 시 즉시 알림

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 라이선스

MIT License

## 🆘 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 이용해 주세요.

---

**Happy Marketing! 🎯**

# Google Sheets API 연동 환경설정

1. Google Cloud에서 서비스 계정 생성 후 JSON 키를 발급받으세요.
2. JSON 파일 전체 내용을 한 줄 문자열로 변환하여 `.env.local`에 아래와 같이 저장하세요:

```
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

- `.env`, `.env.local`, `client_secret_*.json`, `ga-auto-*.json` 등은 이미 `.gitignore`에 추가되어 있으므로 커밋되지 않습니다.
- 절대 서비스 계정 JSON 파일을 직접 커밋하지 마세요!