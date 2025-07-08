# UTM Analytics Dashboard - Gemini CLI 통합 가이드

## 프로젝트 개요
이 프로젝트는 Next.js 14 기반의 UTM 캠페인 관리 및 Google Analytics 4 성과 분석 대시보드입니다.

## 주요 기술 스택
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Heroicons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Custom AuthContext
- **Analytics**: Google Analytics 4 API, Google Trends API
- **AI**: Google Gemini API

## Gemini CLI 사용 가이드

### 대용량 코드베이스 분석
대용량 코드베이스나 여러 파일을 분석할 때는 Gemini CLI의 대용량 컨텍스트 윈도우를 활용하세요. `gemini -p`를 사용하여 Google Gemini의 대용량 컨텍스트 용량을 활용할 수 있습니다.

### 파일 및 디렉토리 포함 구문

`@` 구문을 사용하여 Gemini 프롬프트에 파일과 디렉토리를 포함하세요. 경로는 gemini 명령어를 실행하는 위치를 기준으로 한 상대 경로여야 합니다:

#### 예시:

**단일 파일 분석:**
```bash
gemini -p "@app/components/MainLayout.tsx 이 파일의 목적과 구조를 설명해주세요"
```

**여러 파일 분석:**
```bash
gemini -p "@package.json @app/layout.tsx 프로젝트의 의존성과 레이아웃 구조를 분석해주세요"
```

**전체 디렉토리 분석:**
```bash
gemini -p "@app/ 이 코드베이스의 아키텍처를 요약해주세요"
```

**여러 디렉토리 분석:**
```bash
gemini -p "@app/ @lib/ 소스 코드의 테스트 커버리지를 분석해주세요"
```

**현재 디렉토리 및 하위 디렉토리:**
```bash
gemini -p "@./ 이 전체 프로젝트의 개요를 제공해주세요"
```

**또는 --all_files 플래그 사용:**
```bash
gemini --all_files -p "프로젝트 구조와 의존성을 분석해주세요"
```

### 구현 검증 예시

**기능 구현 확인:**
```bash
gemini -p "@app/ @lib/ 이 코드베이스에 다크 모드가 구현되어 있나요? 관련 파일과 함수를 보여주세요"
```

**인증 구현 확인:**
```bash
gemini -p "@app/ @app/api/auth/ JWT 인증이 구현되어 있나요? 모든 인증 관련 엔드포인트와 미들웨어를 나열해주세요"
```

**특정 패턴 확인:**
```bash
gemini -p "@app/ WebSocket 연결을 처리하는 React 훅이 있나요? 파일 경로와 함께 나열해주세요"
```

**에러 처리 확인:**
```bash
gemini -p "@app/ @app/api/ 모든 API 엔드포인트에 적절한 에러 처리가 구현되어 있나요? try-catch 블록의 예시를 보여주세요"
```

**레이트 리미팅 확인:**
```bash
gemini -p "@app/api/ @middleware/ API에 레이트 리미팅이 구현되어 있나요? 구현 세부사항을 보여주세요"
```

**캐싱 전략 확인:**
```bash
gemini -p "@app/ @lib/ Redis 캐싱이 구현되어 있나요? 모든 캐시 관련 함수와 사용법을 나열해주세요"
```

**특정 보안 조치 확인:**
```bash
gemini -p "@app/ @app/api/ SQL 인젝션 방어가 구현되어 있나요? 사용자 입력이 어떻게 살균되는지 보여주세요"
```

**기능별 테스트 커버리지 확인:**
```bash
gemini -p "@app/ @tests/ 결제 처리 모듈이 완전히 테스트되어 있나요? 모든 테스트 케이스를 나열해주세요"
```

### UTM Analytics Dashboard 특화 분석 예시

**GA4 API 통합 확인:**
```bash
gemini -p "@app/api/analytics/ @lib/ Google Analytics 4 API 통합이 어떻게 구현되어 있나요? 모든 분석 관련 함수를 보여주세요"
```

**UTM 관리 기능 확인:**
```bash
gemini -p "@app/components/ @app/api/utm/ UTM 캠페인 관리 기능이 어떻게 구현되어 있나요? 관련 컴포넌트와 API를 분석해주세요"
```

**코호트 분석 확인:**
```bash
gemini -p "@app/components/ @app/api/analytics/ 코호트 분석 기능이 어떻게 구현되어 있나요? 사용자 여정 분석과 키워드 코호트 분석을 포함해주세요"
```

**주간보고서 생성 확인:**
```bash
gemini -p "@app/components/ @app/api/weekly-report/ 주간보고서 생성 기능이 어떻게 구현되어 있나요? 보고서 템플릿과 생성 로직을 분석해주세요"
```

**인증 시스템 확인:**
```bash
gemini -p "@app/contexts/ @app/api/auth/ 커스텀 인증 시스템이 어떻게 구현되어 있나요? AuthContext와 관련 API를 분석해주세요"
```

**Prisma 스키마 분석:**
```bash
gemini -p "@prisma/ 데이터베이스 스키마가 어떻게 설계되어 있나요? 모든 모델과 관계를 분석해주세요"
```

### Gemini CLI 사용 시기

다음과 같은 경우에 `gemini -p`를 사용하세요:
- 전체 코드베이스나 대용량 디렉토리 분석
- 여러 대용량 파일 비교
- 프로젝트 전체 패턴이나 아키텍처 이해 필요
- 현재 컨텍스트 윈도우가 작업에 부족한 경우
- 100KB 이상의 파일들을 다룰 때
- 특정 기능, 패턴, 보안 조치의 구현 여부 확인
- 전체 코드베이스에서 특정 코딩 패턴의 존재 여부 확인

### 중요 참고사항

- `@` 구문의 경로는 gemini 명령어를 실행할 때의 현재 작업 디렉토리를 기준으로 한 상대 경로입니다
- CLI는 파일 내용을 컨텍스트에 직접 포함시킵니다
- 읽기 전용 분석에는 `--yolo` 플래그가 필요하지 않습니다
- Gemini의 컨텍스트 윈도우는 Claude의 컨텍스트를 넘어서는 전체 코드베이스를 처리할 수 있습니다
- 구현 확인 시 정확한 결과를 얻기 위해 찾고 있는 것을 구체적으로 명시하세요

### 프로젝트 특화 팁

1. **분석 API 라우트**: `@app/api/analytics/` 디렉토리에서 GA4 관련 API 분석
2. **컴포넌트 구조**: `@app/components/` 디렉토리에서 UI 컴포넌트 분석
3. **데이터베이스 스키마**: `@prisma/` 디렉토리에서 데이터 모델 분석
4. **인증 시스템**: `@app/contexts/` 및 `@app/api/auth/` 디렉토리에서 인증 로직 분석
5. **설정 관리**: `@app/settings/` 디렉토리에서 설정 관련 기능 분석