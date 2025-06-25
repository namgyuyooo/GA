# UTM Analytics Dashboard

마케팅 캠페인을 위한 종합 UTM 관리 및 분석 플랫폼입니다.

## 🚀 주요 기능

### 🎯 UTM 관리
- **UTM 빌더**: 실시간 링크 생성 및 미리보기
- **캠페인 관리**: 저장, 수정, 삭제, 상태 관리
- **중복 방지**: 동일한 UTM 조합 자동 검증

### 📊 성과 분석
- **GA4 연동**: 실시간 캠페인 성과 데이터
- **Search Console**: 오가닉 검색 성과
- **자동 분석**: 트렌드, 이상치, 인사이트 생성

### 📈 자동화 보고서
- **주간 보고서**: Excel 형식 자동 생성
- **실시간 알림**: Slack 웹훅 연동
- **스케줄링**: Vercel Cron으로 자동 실행

### 🔐 보안 & 인증
- **Google OAuth**: 간편 로그인
- **권한 관리**: 사용자별 데이터 분리
- **세션 보안**: NextAuth.js 기반

## 🛠 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: NextAuth.js with Google OAuth
- **Deployment**: Vercel
- **Integrations**: Google Analytics 4, Search Console, Slack

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