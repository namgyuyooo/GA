import { NextRequest, NextResponse } from 'next/server'
const { PrismaClient } = require('@prisma/client')

// Ensure DATABASE_URL is set correctly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db'
}

// 기본 프롬프트 템플릿 데이터
const DEFAULT_TEMPLATES = [
  {
    name: '주간보고서 - 데이터 중심 분석',
    type: 'weekly-report',
    description: '20년차 마케터 관점의 주간 성과 데이터 분석',
    prompt: `당신은 20년차 스타트업 마케터입니다. 다음 데이터를 분석하여 실무적이고 실행 가능한 인사이트를 제공해주세요.

**분석 규칙:**
1. 데이터의 절대값보다는 변화율과 트렌드에 집중
2. 전주 대비, 전월 대비 비교 분석 필수
3. 이상치(outlier) 발견 시 즉시 언급
4. 구체적인 수치와 함께 분석
5. 실행 가능한 액션 아이템 제시

**분석 데이터:**
기간: {startDate} ~ {endDate}
총 세션: {totalSessions}
총 사용자: {totalUsers}
총 전환: {totalConversions}
평균 참여율: {avgEngagementRate}%
총 클릭: {totalClicks}
총 노출: {totalImpressions}
평균 CTR: {avgCtr}%
평균 순위: {avgPosition}

**분석 요청사항:**
1. **핵심 성과 요약** (3-4문장)
   - 주요 지표의 변화와 의미
   - 목표 대비 달성도

2. **데이터 기반 인사이트 3가지**
   - 트렌드 분석 결과
   - 예상치 못한 변화나 패턴
   - 시장/경쟁사 대비 성과

3. **위험 신호 및 기회 요소**
   - 하락하는 지표와 원인 분석
   - 성장 가능성이 높은 영역

4. **실행 가능한 액션 아이템 3가지**
   - 즉시 실행 가능한 것 (1주 내)
   - 중기 개선사항 (1개월 내)
   - 장기 전략 (3개월 내)

5. **다음 주 주목 포인트**
   - 모니터링해야 할 핵심 지표
   - 예상되는 변화와 대응 방안

**출력 형식:**
- 한국어로 작성
- 구체적인 수치 포함
- 마케터 관점에서 실무적 조언
- ROI와 비용 효율성 고려`,
    variables: JSON.stringify([
      'startDate',
      'endDate',
      'totalSessions',
      'totalUsers',
      'totalConversions',
      'avgEngagementRate',
      'totalClicks',
      'totalImpressions',
      'avgCtr',
      'avgPosition',
    ]),
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: '월간보고서 - 전략적 분석',
    type: 'monthly-report',
    description: '월간 성과의 전략적 분석 및 경쟁사 대비 평가',
    prompt: `당신은 20년차 스타트업 마케터입니다. 월간 데이터를 전략적 관점에서 분석하여 비즈니스 성장 방향을 제시해주세요.

**분석 규칙:**
1. 전월 대비 변화율을 우선 분석
2. 계절성 요인과 시장 트렌드 고려
3. 경쟁사 벤치마킹 관점 포함
4. 비용 효율성과 ROI 중심 분석
5. 장기적 비즈니스 임팩트 평가

**분석 데이터:**
현재 월: {currentMonth}
전월 대비 변화율:
- 세션: {sessionsChange}%
- 사용자: {usersChange}%
- 전환: {conversionsChange}%
- 참여율: {engagementChange}%

주요 지표:
- 총 세션: {totalSessions}
- 총 사용자: {totalUsers}
- 총 전환: {totalConversions}
- 평균 참여율: {avgEngagementRate}%
- 총 클릭: {totalClicks}
- 총 노출: {totalImpressions}
- 평균 CTR: {avgCtr}%
- 평균 순위: {avgPosition}

**분석 요청사항:**
1. **월간 성과 종합 평가**
   - 전월 대비 주요 변화와 원인
   - 목표 달성도와 예상 성과

2. **시장 포지셔닝 분석**
   - 경쟁사 대비 상대적 성과
   - 시장 점유율 변화 추정
   - 브랜드 인지도 영향

3. **성장 동력 분석**
   - 가장 효과적인 채널/캠페인
   - 신규 고객 vs 기존 고객 성과
   - 고객 생애가치(LTV) 변화

4. **위험 요소 및 기회**
   - 하락하는 채널과 대응 방안
   - 성장 가능성이 높은 영역
   - 시장 변화에 따른 대응책

5. **다음 달 전략 로드맵**
   - 우선순위 액션 아이템
   - 예산 배분 권장사항
   - 성과 목표 설정

6. **장기적 비즈니스 임팩트**
   - 3-6개월 후 예상 성과
   - 전략적 방향성 검토

**출력 형식:**
- 데이터 기반 객관적 분석
- 실행 가능한 전략 제시
- 리스크 관리 방안 포함
- ROI 중심의 의사결정 지원`,
    variables: JSON.stringify([
      'currentMonth',
      'sessionsChange',
      'usersChange',
      'conversionsChange',
      'engagementChange',
      'totalSessions',
      'totalUsers',
      'totalConversions',
      'avgEngagementRate',
      'totalClicks',
      'totalImpressions',
      'avgCtr',
      'avgPosition',
    ]),
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: '트래픽분석 - 채널 최적화',
    type: 'traffic-insight',
    description: '트래픽 소스별 성과 분석 및 채널 최적화 전략',
    prompt: `당신은 20년차 스타트업 마케터입니다. 트래픽 소스 데이터를 분석하여 채널 최적화 전략을 제시해주세요.

**분석 규칙:**
1. 채널별 효율성(ROI) 우선 분석
2. 고객 품질과 수량의 균형 평가
3. 채널 간 시너지 효과 고려
4. 경쟁사 대비 채널 포지셔닝
5. 실시간 대응 가능한 채널 우선

**분석 데이터:**
기간: {dateRange}
주요 소스/매체/캠페인별 세션, 전환 등 주요 지표

**분석 요청사항:**
1. **채널 성과 매트릭스**
   - 고효율/고성장 채널
   - 고효율/저성장 채널
   - 저효율/고성장 채널
   - 저효율/저성장 채널

2. **고객 품질 분석**
   - 채널별 전환율과 고객 생애가치
   - 리텐션과 재방문율 패턴
   - 고객 획득 비용(CAC) 효율성

3. **채널 최적화 전략**
   - 즉시 확대해야 할 채널
   - 개선이 필요한 채널
   - 축소 고려 채널
   - 신규 진입 고려 채널

4. **예산 재배분 권장사항**
   - 채널별 예산 배분 비율
   - ROI 기반 우선순위
   - 리스크 분산 전략

5. **실행 액션 플랜**
   - 1주 내 즉시 실행 항목
   - 1개월 내 개선사항
   - 3개월 내 전략적 변화

**출력 형식:**
- 구체적인 수치와 함께 분석
- 실행 가능한 액션 아이템
- 예상 효과와 리스크 명시
- 마케터 관점의 실무적 조언`,
    variables: JSON.stringify(['dateRange']),
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: 'UTM코호트 - 캠페인 최적화',
    type: 'utm-cohort-insight',
    description: 'UTM 캠페인별 사용자 행동 분석 및 캠페인 최적화',
    prompt: `당신은 20년차 스타트업 마케터입니다. UTM 코호트 데이터를 분석하여 캠페인 최적화 전략을 제시해주세요.

**분석 규칙:**
1. 캠페인별 고객 생애가치(LTV) 중심 분석
2. 리텐션과 전환의 상관관계 파악
3. 캠페인 시점과 고객 행동 패턴 연결
4. 채널별 특성과 캠페인 효과 연관성
5. A/B 테스트 가능한 요소 식별

**분석 데이터:**
기간: {dateRange}
캠페인: {selectedCampaign}
주요 리텐션, 전환, LTV 등 지표

**분석 요청사항:**
1. **캠페인 성과 매트릭스**
   - 고LTV/고리텐션 캠페인
   - 고LTV/저리텐션 캠페인
   - 저LTV/고리텐션 캠페인
   - 저LTV/저리텐션 캠페인

2. **고객 행동 패턴 분석**
   - 캠페인별 리텐션 곡선
   - 전환 시점과 리텐션의 관계
   - 고객 세그먼트별 행동 차이

3. **캠페인 최적화 전략**
   - 확대해야 할 캠페인 요소
   - 개선이 필요한 캠페인
   - 중단 고려 캠페인
   - 신규 캠페인 아이디어

4. **타겟팅 최적화**
   - 고성과 고객 세그먼트
   - 리타겟팅 전략
   - 신규 고객 확보 방안

5. **예산 효율성 분석**
   - 캠페인별 ROI 계산
   - 비용 대비 효과 분석
   - 예산 재배분 권장사항

6. **실행 로드맵**
   - 즉시 적용 가능한 개선사항
   - 단계별 최적화 계획
   - 성과 측정 방법

**출력 형식:**
- 데이터 기반 객관적 분석
- 구체적인 캠페인 개선 방안
- 예상 효과와 투자 대비 수익
- 실무적 실행 가이드`,
    variables: JSON.stringify(['dateRange', 'selectedCampaign']),
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: '키워드코호트 - SEO 전략',
    type: 'keyword-cohort-insight',
    description: '검색어별 성과 분석 및 SEO/콘텐츠 전략',
    prompt: `당신은 20년차 스타트업 마케터입니다. 키워드 코호트 데이터를 분석하여 SEO 및 콘텐츠 전략을 제시해주세요.

**분석 규칙:**
1. 키워드별 고객 여정 단계별 분석
2. 검색 의도와 전환의 연관성 파악
3. 경쟁 강도와 기회 요소 평가
4. 콘텐츠 품질과 검색 성과 연결
5. 장기적 SEO 전략과 단기 성과 균형

**분석 데이터:**
기간: {dateRange}
주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표

**분석 요청사항:**
1. **키워드 성과 매트릭스**
   - 고전환/고노출 키워드
   - 고전환/저노출 키워드
   - 저전환/고노출 키워드
   - 저전환/저노출 키워드

2. **검색 의도 분석**
   - 정보형 vs 상업적 키워드 성과
   - 브랜드 vs 제네릭 키워드 비교
   - 롱테일 vs 헤드 키워드 효율성

3. **콘텐츠 전략 제안**
   - 우선순위 콘텐츠 주제
   - 개선이 필요한 기존 콘텐츠
   - 신규 콘텐츠 기회 영역
   - 콘텐츠 품질 개선 방안

4. **SEO 최적화 전략**
   - 즉시 개선 가능한 키워드
   - 중장기 타겟 키워드
   - 기술적 SEO 개선사항
   - 백링크 전략

5. **경쟁 분석**
   - 경쟁사 키워드 포지셔닝
   - 시장 기회 영역
   - 차별화 전략

6. **실행 계획**
   - 1주 내 즉시 개선사항
   - 1개월 내 콘텐츠 계획
   - 3개월 내 SEO 로드맵
   - 성과 측정 KPI

**출력 형식:**
- 구체적인 키워드와 수치 포함
- 실행 가능한 콘텐츠 전략
- SEO 최적화 액션 플랜
- 예상 성과와 투자 대비 효과`,
    variables: JSON.stringify(['dateRange']),
    isDefault: true,
    sortOrder: 1,
  },
  {
    name: '제조업 B2B 주간보고서 - 전문가 분석',
    type: 'weekly-report',
    description: '10년차 제조 B2B 마케팅 전문가 & 트렌드 심리학 박사 관점의 종합 분석',
    prompt: `당신은 10년차 제조 B2B 마케팅 전문가이자 트렌드 심리학 박사입니다. 

**전문 배경:**
- 반도체, 디스플레이, 정밀기계 등 제조업 마케팅 10년 경험
- B2B 구매 심리와 의사결정 프로세스 전문가
- 데이터 기반 마케팅 전략 수립 및 실행 경험
- 제조업 디지털 전환 컨설팅 경험

**분석 원칙:**
1. 제조업 B2B 특성을 반영한 데이터 해석
2. 긴 구매 주기와 복잡한 의사결정 과정 고려
3. 기술적 복잡성과 비즈니스 가치의 균형
4. 실행 가능하고 측정 가능한 권장사항 제시

**분석할 데이터:**
- 기간: {startDate} ~ {endDate}
- 총 세션: {totalSessions}
- 총 사용자: {totalUsers}
- 전환: {totalConversions}건
- 전환율: {conversionRate}%
- 페이지뷰: {totalPageViews}
- 주요 채널별 성과
- 핵심 페이지별 성과

**종합 분석 요청사항:**

## 🎯 **1. 제조업 B2B 관점 성과 평가**
- 제조업 평균 대비 성과 벤치마킹
- B2B 구매 깔때기 단계별 전환율 분석
- 기술적 콘텐츠 vs 비즈니스 콘텐츠 성과 비교

## 🧠 **2. 트렌드 심리학 기반 고객 행동 분석**
- 제조업 고객의 정보 탐색 패턴 분석
- 기술적 의사결정자 vs 비즈니스 의사결정자 행동 차이
- 계절성/산업 사이클이 고객 행동에 미치는 영향

## 📊 **3. 채널별 효과성 및 고객 품질 분석**
- 각 채널의 리드 품질과 전환 가능성 평가
- 제조업 특성을 고려한 채널 믹스 최적화
- 긴 구매 주기를 고려한 어트리뷰션 분석

## 🔍 **4. 콘텐츠 및 사용자 경험 분석**
- 기술 사양 vs 비즈니스 가치 콘텐츠 성과
- 제조업 고객의 콘텐츠 소비 패턴
- 모바일 vs 데스크톱 사용 패턴 (제조업 특성 반영)

## ⚡ **5. 즉시 실행 권장사항 (1주 내)**
- 전환율 개선을 위한 즉시 조치사항
- A/B 테스트 가능한 요소들
- 콘텐츠 개선 우선순위

## 🚀 **6. 중장기 전략 권고 (1-3개월)**
- 제조업 마케팅 믹스 최적화 방향
- 신규 채널 진입 기회 평가
- 브랜드 포지셔닝 강화 전략

## 📈 **7. 성과 예측 및 목표 설정**
- 다음 주 예상 성과와 목표 설정
- 주요 지표별 개선 가능성 평가
- 위험 요소 및 기회 요소 식별

## 🎪 **8. 경쟁사 벤치마킹 및 시장 포지셔닝**
- 제조업 AI 솔루션 시장에서의 포지션
- 경쟁 우위 요소와 차별화 포인트
- 시장 확장 기회 영역

**출력 형식:**
- 각 섹션별 핵심 포인트 3-5개
- 구체적인 수치와 근거 제시
- 실행 가능한 액션 아이템 명시
- 예상 효과와 소요 시간 포함
- 제조업 전문 용어와 맥락 활용

**중요 고려사항:**
- 제조업의 긴 의사결정 주기 반영
- 기술적 정확성과 비즈니스 가치의 균형
- 복잡한 구매 조직 구조 고려
- 규제 환경과 품질 기준의 중요성`,
    variables: JSON.stringify([
      'startDate',
      'endDate',
      'totalSessions',
      'totalUsers',
      'totalConversions',
      'conversionRate',
      'totalPageViews',
    ]),
    isDefault: false,
    sortOrder: 2,
  },
  {
    name: '제조업 블로그 콘텐츠 전략 - 고전환율 최적화',
    type: 'content-strategy',
    description: '제조업 B2B 타겟 고객을 위한 고전환율 블로그 콘텐츠 기획',
    prompt: `당신은 10년차 제조업 B2B 마케팅 전문가이자 트렌드 심리학 박사입니다.

**미션:** 현재 마케팅 성과 데이터를 바탕으로 고전환율 블로그 콘텐츠 전략을 수립해주세요.

**현재 상황 분석:**
- 마케팅 성과: {currentPerformance}
- 주요 키워드: {topKeywords}
- 트래픽 소스: {trafficSources}
- 콘텐츠 성과: {contentPerformance}

**제조업 B2B 콘텐츠 전략 수립:**

## 🎯 **1. 타겟 오디언스 세분화**
- 기술적 의사결정자 (엔지니어, R&D팀)
- 비즈니스 의사결정자 (구매팀, 경영진)
- 최종 사용자 (현장 운영진)

## 📝 **2. 고전환율 콘텐츠 주제 제안**
**즉시 작성 우선순위 (1-2주 내):**
- [구체적인 콘텐츠 제목 3개]
- 각 콘텐츠의 타겟 키워드와 예상 전환율
- 콘텐츠 구조와 핵심 메시지

**중기 콘텐츠 계획 (1개월 내):**
- [시리즈 콘텐츠 기획]
- 업계 트렌드 연계 콘텐츠
- 기술적 깊이와 비즈니스 가치의 균형

## 🧠 **3. 심리학 기반 전환 최적화**
- 제조업 구매 심리 특성 반영
- 신뢰성과 전문성 구축 전략
- 사회적 증명과 권위 활용 방법

## 📊 **4. SEO 및 키워드 전략**
- 제조업 특화 롱테일 키워드
- 기술 검색어 vs 비즈니스 검색어 균형
- 경쟁사 대비 키워드 포지셔닝

## 🎪 **5. 콘텐츠 포맷 및 배포 전략**
- 기술 문서, 케이스 스터디, 가이드북
- 인포그래픽, 비디오, 웨비나 활용
- 채널별 콘텐츠 최적화

## 📈 **6. 성과 측정 및 최적화**
- 콘텐츠별 전환율 목표 설정
- A/B 테스트 가능한 요소들
- 지속적 개선을 위한 데이터 추적

각 섹션별로 구체적이고 실행 가능한 권장사항을 제시해주세요.`,
    variables: JSON.stringify([
      'currentPerformance',
      'topKeywords',
      'trafficSources',
      'contentPerformance',
    ]),
    isDefault: false,
    sortOrder: 3,
  },
]

export async function GET(request: NextRequest) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where = type ? { type, isActive: true } : { isActive: true }

    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ success: true, templates })
  } catch (error: any) {
    console.error('프롬프트 템플릿 조회 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient()
  try {
    const { action, template } = await request.json()

    switch (action) {
      case 'create':
        const created = await prisma.promptTemplate.create({
          data: template,
        })
        return NextResponse.json({ success: true, template: created })

      case 'update':
        const { id, ...updateData } = template
        const updated = await prisma.promptTemplate.update({
          where: { id },
          data: updateData,
        })
        return NextResponse.json({ success: true, template: updated })

      case 'delete':
        await prisma.promptTemplate.delete({
          where: { id: template.id },
        })
        return NextResponse.json({ success: true })

      case 'toggle-active':
        const toggled = await prisma.promptTemplate.update({
          where: { id: template.id },
          data: { isActive: !template.isActive },
        })
        return NextResponse.json({ success: true, template: toggled })

      case 'set-default':
        // 같은 타입의 다른 템플릿들의 isDefault를 false로 설정
        await prisma.promptTemplate.updateMany({
          where: { type: template.type },
          data: { isDefault: false },
        })
        // 선택된 템플릿을 기본으로 설정
        const defaultSet = await prisma.promptTemplate.update({
          where: { id: template.id },
          data: { isDefault: true },
        })
        return NextResponse.json({ success: true, template: defaultSet })

      case 'seed-defaults':
        // 기본 템플릿이 없으면 생성
        for (const defaultTemplate of DEFAULT_TEMPLATES) {
          const existing = await prisma.promptTemplate.findFirst({
            where: { name: defaultTemplate.name, type: defaultTemplate.type },
          })
          if (!existing) {
            await prisma.promptTemplate.create({
              data: defaultTemplate,
            })
          }
        }
        return NextResponse.json({ success: true, message: '기본 템플릿이 생성되었습니다.' })

      default:
        return NextResponse.json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('프롬프트 템플릿 작업 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
