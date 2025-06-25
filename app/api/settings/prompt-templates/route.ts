import { NextRequest, NextResponse } from 'next/server'
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 기본 프롬프트 템플릿 데이터
const DEFAULT_TEMPLATES = [
  {
    name: '주간보고서 기본',
    type: 'weekly-report',
    description: '주간 성과 요약 및 주요 인사이트',
    prompt: `다음은 주간 분석 보고서 데이터입니다.

기간: {startDate} ~ {endDate}
총 세션: {totalSessions}
총 사용자: {totalUsers}
총 전환: {totalConversions}
평균 참여율: {avgEngagementRate}%

주요 지표:
- 세션 수: {totalSessions}
- 사용자 수: {totalUsers}
- 전환 수: {totalConversions}
- 평균 참여율: {avgEngagementRate}%
- 총 클릭: {totalClicks}
- 총 노출: {totalImpressions}
- 평균 CTR: {avgCtr}%
- 평균 순위: {avgPosition}

위 데이터를 바탕으로 다음을 포함한 주간 보고서를 작성해주세요:
1. 주요 성과 요약 (3-4문장)
2. 핵심 인사이트 3가지
3. 개선이 필요한 영역 2가지
4. 다음 주 주목할 점 2가지

한국어로 작성하고, 구체적인 수치와 함께 분석해주세요.`,
    variables: JSON.stringify(['startDate', 'endDate', 'totalSessions', 'totalUsers', 'totalConversions', 'avgEngagementRate', 'totalClicks', 'totalImpressions', 'avgCtr', 'avgPosition']),
    isDefault: true,
    sortOrder: 1
  },
  {
    name: '월간보고서 기본',
    type: 'monthly-report',
    description: '월간 성과 분석 및 전월 대비 비교',
    prompt: `다음은 월간 분석 보고서 데이터입니다.

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

위 데이터를 바탕으로 다음을 포함한 월간 보고서를 작성해주세요:
1. 월간 성과 요약 (전월 대비)
2. 주요 성장 영역 3가지
3. 개선이 필요한 영역 2가지
4. 다음 달 전략 제안 3가지
5. 예상 성과 목표

한국어로 작성하고, 전월 대비 변화를 중심으로 분석해주세요.`,
    variables: JSON.stringify(['currentMonth', 'sessionsChange', 'usersChange', 'conversionsChange', 'engagementChange', 'totalSessions', 'totalUsers', 'totalConversions', 'avgEngagementRate', 'totalClicks', 'totalImpressions', 'avgCtr', 'avgPosition']),
    isDefault: true,
    sortOrder: 1
  },
  {
    name: '트래픽분석 인사이트',
    type: 'traffic-insight',
    description: '트래픽 소스별 성과 분석',
    prompt: `다음은 트래픽 소스 분석 주요 데이터입니다.

기간: {dateRange}
주요 소스/매체/캠페인별 세션, 전환 등 주요 지표를 바탕으로 다음을 분석해주세요:

1. **주요 인사이트 3가지**
   - 가장 효과적인 트래픽 소스
   - 개선이 필요한 영역
   - 예상치 못한 성과

2. **개선 제안 2가지**
   - 구체적인 액션 아이템
   - 예상 효과

3. **우선순위 권장사항**
   - 즉시 실행 가능한 것
   - 중장기 계획

한국어로 작성하고, 구체적인 수치와 함께 분석해주세요.`,
    variables: JSON.stringify(['dateRange']),
    isDefault: true,
    sortOrder: 1
  },
  {
    name: 'UTM코호트 인사이트',
    type: 'utm-cohort-insight',
    description: 'UTM 캠페인별 사용자 리텐션 분석',
    prompt: `다음은 UTM 코호트 분석 주요 데이터입니다.

기간: {dateRange}
캠페인: {selectedCampaign}
주요 리텐션, 전환, LTV 등 지표를 바탕으로 다음을 분석해주세요:

1. **주요 인사이트 3가지**
   - 리텐션이 높은 캠페인 특성
   - 전환율과 LTV의 상관관계
   - 개선이 필요한 캠페인

2. **개선 제안 2가지**
   - 캠페인 최적화 방안
   - 예상 성과 향상

3. **캠페인 전략 권장사항**
   - 성과가 좋은 캠페인 확대 방안
   - 개선이 필요한 캠페인 대응책

한국어로 작성하고, 구체적인 수치와 함께 분석해주세요.`,
    variables: JSON.stringify(['dateRange', 'selectedCampaign']),
    isDefault: true,
    sortOrder: 1
  },
  {
    name: '키워드코호트 인사이트',
    type: 'keyword-cohort-insight',
    description: '검색어별 사용자 행동 분석',
    prompt: `다음은 키워드 코호트 분석 주요 데이터입니다.

기간: {dateRange}
주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표를 바탕으로 다음을 분석해주세요:

1. **주요 인사이트 3가지**
   - 고성과 키워드의 특성
   - 전환율과 리텐션의 관계
   - 개선이 필요한 키워드

2. **개선 제안 2가지**
   - 키워드 최적화 방안
   - 콘텐츠 전략 제안

3. **SEO 전략 권장사항**
   - 우선순위 키워드 선정
   - 예상 성과 향상

한국어로 작성하고, 구체적인 수치와 함께 분석해주세요.`,
    variables: JSON.stringify(['dateRange']),
    isDefault: true,
    sortOrder: 1
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const where = type ? { type, isActive: true } : { isActive: true }
    
    const templates = await prisma.promptTemplate.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    })
    
    return NextResponse.json({ success: true, templates })
  } catch (error: any) {
    console.error('프롬프트 템플릿 조회 오류:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, template } = await request.json()
    
    switch (action) {
      case 'create':
        const created = await prisma.promptTemplate.create({
          data: template
        })
        return NextResponse.json({ success: true, template: created })
        
      case 'update':
        const { id, ...updateData } = template
        const updated = await prisma.promptTemplate.update({
          where: { id },
          data: updateData
        })
        return NextResponse.json({ success: true, template: updated })
        
      case 'delete':
        await prisma.promptTemplate.delete({
          where: { id: template.id }
        })
        return NextResponse.json({ success: true })
        
      case 'toggle-active':
        const toggled = await prisma.promptTemplate.update({
          where: { id: template.id },
          data: { isActive: !template.isActive }
        })
        return NextResponse.json({ success: true, template: toggled })
        
      case 'set-default':
        // 같은 타입의 다른 템플릿들의 isDefault를 false로 설정
        await prisma.promptTemplate.updateMany({
          where: { type: template.type },
          data: { isDefault: false }
        })
        // 선택된 템플릿을 기본으로 설정
        const defaultSet = await prisma.promptTemplate.update({
          where: { id: template.id },
          data: { isDefault: true }
        })
        return NextResponse.json({ success: true, template: defaultSet })
        
      case 'seed-defaults':
        // 기본 템플릿이 없으면 생성
        for (const defaultTemplate of DEFAULT_TEMPLATES) {
          const existing = await prisma.promptTemplate.findFirst({
            where: { name: defaultTemplate.name, type: defaultTemplate.type }
          })
          if (!existing) {
            await prisma.promptTemplate.create({
              data: defaultTemplate
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
  }
} 