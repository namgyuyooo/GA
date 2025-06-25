# Contributing to UTM Analytics Dashboard

UTM Analytics Dashboard에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 🤝 기여 방법

### 1. 이슈 보고
버그를 발견하거나 새로운 기능을 제안하고 싶다면:
- [Issues](https://github.com/your-username/utm-analytics-dashboard/issues)에서 기존 이슈를 확인해주세요
- 중복이 없다면 새로운 이슈를 생성해주세요
- 제공된 템플릿을 사용해주세요

### 2. 개발 환경 설정

#### 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- PostgreSQL (개발용)
- Git

#### 설정 단계
```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/your-username/utm-analytics-dashboard.git
cd utm-analytics-dashboard

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 값들을 설정

# 4. 데이터베이스 설정
npx prisma generate
npx prisma db push

# 5. 개발 서버 실행
npm run dev
```

### 3. 개발 워크플로우

#### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 새로운 기능 개발
- `bugfix/*`: 버그 수정
- `hotfix/*`: 긴급 수정

#### 커밋 컨벤션
[Conventional Commits](https://www.conventionalcommits.org/) 규칙을 따릅니다:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가 또는 수정
- `chore`: 빌드 프로세스 또는 보조 도구 변경

**예시:**
```bash
feat(utm-builder): add URL preview functionality
fix(api): resolve authentication error in campaign API
docs(readme): update installation instructions
```

### 4. 코드 스타일

#### TypeScript/JavaScript
- ESLint 설정을 따름
- Prettier로 코드 포맷팅
- 함수와 변수에 의미있는 이름 사용
- 복잡한 로직에 주석 추가

#### React 컴포넌트
- 함수형 컴포넌트 사용
- TypeScript 인터페이스로 props 타입 정의
- 커스텀 훅으로 로직 분리
- 접근성(a11y) 고려

#### CSS/Styling
- Tailwind CSS 사용
- 반응형 디자인 적용
- 일관된 색상 팔레트 사용

### 5. 테스트

#### 테스트 작성 가이드
```bash
# 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:coverage
```

- 새로운 기능에는 반드시 테스트 작성
- API 엔드포인트는 유닛 테스트 필수
- 컴포넌트는 렌더링 테스트 포함

### 6. Pull Request 가이드

#### PR 생성 전 체크리스트
- [ ] 코드가 ESLint 규칙을 통과함
- [ ] 모든 테스트가 통과함
- [ ] 타입 체크 오류가 없음
- [ ] 변경 사항에 대한 테스트 작성
- [ ] 관련 문서 업데이트

#### PR 템플릿 사용
제공된 [PR 템플릿](.github/pull_request_template.md)을 사용하여:
- 변경 사항 요약
- 테스트 방법 설명
- 관련 이슈 연결
- 스크린샷 첨부 (UI 변경 시)

### 7. 코드 리뷰

#### 리뷰어 가이드라인
- 건설적인 피드백 제공
- 코드 품질, 성능, 보안 관점에서 검토
- 대안 제시 시 이유 설명

#### 작성자 가이드라인
- 피드백에 열린 마음으로 응답
- 변경 요청 시 즉시 대응
- 코드 변경 사유 명확히 설명

## 📋 개발 가이드라인

### API 개발
```typescript
// API 라우트 예시
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 로직 구현
    // ...

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 컴포넌트 개발
```typescript
interface Props {
  campaign: UTMCampaign
  onUpdate: (campaign: UTMCampaign) => void
}

export default function CampaignCard({ campaign, onUpdate }: Props) {
  // 컴포넌트 로직
}
```

### 상태 관리
- 서버 상태: API 호출 결과
- 클라이언트 상태: UI 상태, 폼 데이터
- URL 상태: 검색, 필터, 페이지네이션

## 🚀 배포

### 개발 환경
- Vercel Preview를 통한 자동 배포
- PR 생성 시 미리보기 링크 제공

### 프로덕션 환경
- `main` 브랜치 머지 시 자동 배포
- 환경 변수 검증
- 데이터베이스 마이그레이션 확인

## 📚 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel Documentation](https://vercel.com/docs)

## 🆘 도움이 필요한 경우

- [Discord 커뮤니티](https://discord.gg/your-server) 참여
- [Discussions](https://github.com/your-username/utm-analytics-dashboard/discussions)에서 질문
- 이메일: your-email@example.com

## 📄 라이선스

이 프로젝트에 기여함으로써 MIT 라이선스 하에 기여 내용을 제공하는 것에 동의합니다.

---

감사합니다! 🎉