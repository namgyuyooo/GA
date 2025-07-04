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

### 3. 환경변수 설정**
`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:port/database

# Google Analytics & Search Console
GA4_PROPERTY_ID=your-ga4-property-id
GSC_SITE_URL=sc-domain:your-domain.com
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_PROJECT_ID=your-gcp-project-id

# Authentication
JWT_SECRET=your-jwt-secret-key
SUPER_USER_EMAIL=admin@your-domain.com
SUPER_USER_PASSWORD=your-secure-password
SUPER_USER_NAME=Super Admin
```

### 4. 데이터베이스 설정
```bash
# 데이터베이스 스키마 생성
npx prisma db push

# Prisma 클라이언트 생성
npx prisma generate
```

### 5. 슈퍼유저 초기화
```bash
# 서버 시작 후
curl -X POST http://localhost:3000/api/auth/init-superuser-direct
```

### 6. 개발 서버 실행
```bash
npm run dev
```

서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 🔑 인증 및 권한

### **로그인**
1. 브라우저에서 앱에 접속
2. 자동으로 로그인 페이지로 리다이렉트
3. 슈퍼유저 계정으로 로그인:
   - 이메일: `SUPER_USER_EMAIL` 환경변수 값
   - 비밀번호: `SUPER_USER_PASSWORD` 환경변수 값

### **권한 레벨**
- **SUPER_ADMIN**: 모든 기능 + 사용자 관리
- **ADMIN**: 대시보드 관리 기능
- **USER**: 읽기 전용 접근

### **사용자 관리**
SUPER_ADMIN 계정으로 로그인 후 `/admin/users`에서 새 사용자를 추가할 수 있습니다.

## 📊 주요 화면

### **1. 대시보드**
- 핵심 지표 요약
- 실시간 트래픽 현황
- 주요 캠페인 성과

### **2. UTM 관리**
- UTM 빌더: 캠페인 URL 생성
- UTM 목록: 생성된 캠페인 관리
- 코호트 분석: 캠페인별 성과 비교

### **3. 검색어 분석**
- 키워드 코호트 분석
- Google Trends 연동
- 검색 성과 추적

### **4. 사용자 여정**
- 페이지 전환 경로
- 체류시간 분석
- 전환 퍼널 분석

### **5. 주간 보고서**
- AI 기반 성과 분석
- 주간별 트렌드 비교
- 개선 권장사항

## 🔧 API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
- 로그인 후 `/api-docs` 페이지 방문
- 모든 API 엔드포인트 테스트 가능

### **주요 API 엔드포인트**

#### **인증**
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

#### **분석 데이터**
- `GET /api/analytics/traffic` - 트래픽 데이터
- `GET /api/analytics/utm-campaigns` - UTM 캠페인 데이터
- `GET /api/analytics/user-journey` - 사용자 여정 데이터
- `GET /api/analytics/google-trends` - Google Trends 데이터

#### **AI 인사이트**
- `POST /api/ai-insight` - AI 분석 생성
- `GET /api/ai-insight` - 저장된 인사이트 조회

## 🚀 배포

### **Vercel 배포 (권장)**
1. Vercel에 프로젝트 연결
2. 환경변수 설정
3. 자동 배포 완료

### **Docker 배포**
```bash
# Docker 이미지 빌드
docker build -t rtm-analytics .

# 컨테이너 실행
docker run -p 3000:3000 --env-file .env rtm-analytics
```

## 🔍 모니터링 및 로깅

- **에러 추적**: Next.js 내장 에러 핸들링
- **성능 모니터링**: Web Vitals 측정
- **데이터 로그**: 데이터 업데이트 이력 추적

## 🤝 기여 가이드

1. Fork 저장소
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문의**: [admin@rtm.ai](mailto:admin@rtm.ai)
- **문서**: [Wiki](https://github.com/your-org/rtm-analytics/wiki)

---

**RTM Analytics Dashboard** - 제조업 B2B 마케팅의 디지털 트랜스포메이션을 가속화합니다. 🚀