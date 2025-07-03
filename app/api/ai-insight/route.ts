import { NextRequest, NextResponse } from 'next/server'
import { runGeminiPrompt, getBestFreeGeminiModel } from '../../../lib/geminiClient'
const { PrismaClient } = require('@prisma/client')

// Ensure DATABASE_URL is set correctly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db'
}

const prisma = new PrismaClient()

// 프롬프트 템플릿에서 변수를 실제 값으로 치환
function replaceTemplateVariables(template: string, variables: any): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value))
  }
  return result
}

// 타입별 기본 프롬프트 매핑
const DEFAULT_PROMPTS = {
  'dashboard': '다음은 대시보드 주요 데이터입니다. 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'traffic': '다음은 트래픽 소스 분석 주요 데이터입니다. 주요 소스/매체/캠페인별 세션, 전환 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'utm-cohort': '다음은 UTM 코호트 분석 주요 데이터입니다. 주요 리텐션, 전환, LTV 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'keyword-cohort': '다음은 키워드 코호트 분석 주요 데이터입니다. 주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'user-journey': '다음은 사용자 여정 분석 데이터입니다. 페이지 전환, 체류 시간, 스크롤 깊이, 재방문율, 사용자 행동 패턴, 유입 경로, 이탈/전환 목표 등을 바탕으로 3가지 핵심 인사이트와 2가지 UX 최적화 제안을 한국어로 요약해줘.',
  'weekly-report': '다음은 주간 분석 보고서 데이터입니다. 주요 성과 요약, 핵심 인사이트, 개선 영역, 다음 주 주목할 점을 포함한 주간 보고서를 작성해주세요.',
  'monthly-report': '다음은 월간 분석 보고서 데이터입니다. 월간 성과 요약, 주요 성장 영역, 개선 영역, 다음 달 전략을 포함한 월간 보고서를 작성해주세요.'
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, type, propertyId, templateId, variables } = await request.json()
    
    if (!type || !propertyId) {
      return NextResponse.json({ success: false, error: 'type, propertyId가 필요합니다.' }, { status: 400 })
    }

    let finalPrompt = prompt
    
    // 템플릿 ID가 제공된 경우 템플릿 사용
    if (templateId) {
      const template = await prisma.promptTemplate.findUnique({
        where: { id: templateId }
      })
      
      if (template && template.isActive) {
        finalPrompt = replaceTemplateVariables(template.prompt, variables || {})
      } else {
        return NextResponse.json({ success: false, error: '유효하지 않은 템플릿입니다.' }, { status: 400 })
      }
    } else if (!prompt) {
      // 프롬프트가 없으면 타입별 기본 프롬프트 사용
      finalPrompt = DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS] || '주요 데이터를 바탕으로 인사이트를 생성해주세요.'
    }

    const selectedModel = model || (await getBestFreeGeminiModel())
    const result = await runGeminiPrompt(finalPrompt, undefined, selectedModel)
    
    // DB 저장
    const saved = await prisma.insight.create({
      data: {
        type,
        propertyId,
        model: selectedModel,
        prompt: finalPrompt,
        result
      }
    })
    
    return NextResponse.json({ success: true, insight: result, saved })
  } catch (e: any) {
    console.error('AI 인사이트 생성 오류:', e)
    return NextResponse.json({ success: false, error: e.message || 'AI 인사이트 생성 실패' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const propertyId = searchParams.get('propertyId')
    
    if (!type || !propertyId) {
      return NextResponse.json({ success: false, error: 'type, propertyId 쿼리 필요' }, { status: 400 })
    }
    
    const latest = await prisma.insight.findFirst({
      where: { type, propertyId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ success: true, insight: latest })
  } catch (e: any) {
    console.error('인사이트 조회 오류:', e)
    return NextResponse.json({ success: false, error: e.message || '인사이트 조회 실패' }, { status: 500 })
  }
}

// 프롬프트 템플릿 가져오기
let promptTemplate = '';
if (templateId) {
  const templateRes = await prisma.promptTemplate.findUnique({
    where: { id: templateId }
  });
  if (templateRes) {
    promptTemplate = templateRes.content;
  }
}

// 기본 프롬프트 템플릿
if (!promptTemplate) {
  switch (type) {
    case 'dashboard':
      promptTemplate = `당신은 20년 경력의 스타트업 마케터입니다. 다음 데이터를 바탕으로 데이터 기반 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- 총 세션: {totalSessions}
- 총 사용자: {totalUsers}
- 총 전환: {totalConversions}
- 평균 참여율: {avgEngagementRate}%
- 총 클릭: {totalClicks}

**분석 요청:**
1. 핵심 성과 지표 분석
2. 개선이 필요한 영역 식별
3. 구체적인 액션 아이템 제시
4. 데이터 기반 마케팅 전략 제안

전문적이고 실용적인 관점에서 분석해주세요.`;
      break;
    case 'user-journey':
      promptTemplate = `당신은 20년 경력의 UX/마케팅 전문가입니다. 사용자 여정 분석 데이터를 바탕으로 심층적인 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- 페이지 전환 패턴: {pageTransitions}
- 체류 시간 분석: {dwellTime}
- 스크롤 깊이: {scrollDepth}
- 재방문율: {revisitRate}
- 관심도 지표: {interestMetrics}
- 사용자 행동 패턴: {userBehaviorPatterns}
- 시간대별 분석: {timeOfDayAnalysis}
- 디바이스별 분석: {deviceAnalysis}

**분석 요청:**
1. 사용자 여정의 주요 패턴과 인사이트
2. 전환율 개선을 위한 UX 최적화 포인트
3. 사용자 행동의 시간대별/디바이스별 특성
4. 콘텐츠 전략 및 페이지 최적화 방안
5. 구체적인 A/B 테스트 아이디어

데이터 기반의 실용적인 제안을 해주세요.`;
      break;
    case 'utm-cohort':
      promptTemplate = `당신은 20년 경력의 디지털 마케팅 전문가입니다. UTM 코호트 분석 데이터를 바탕으로 마케팅 전략 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- UTM 코호트 데이터: {utmCohortData}

**분석 요청:**
1. UTM 캠페인별 성과 분석
2. 코호트별 사용자 행동 패턴
3. 마케팅 채널 최적화 방안
4. ROI 개선을 위한 전략적 제안

전문적이고 실용적인 관점에서 분석해주세요.`;
      break;
    case 'keyword-cohort':
      promptTemplate = `당신은 20년 경력의 SEO/검색 마케팅 전문가입니다. 키워드 코호트 분석 데이터를 바탕으로 검색 전략 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- 키워드 코호트 데이터: {keywordCohortData}

**분석 요청:**
1. 키워드별 사용자 행동 패턴
2. 검색 의도별 전환율 분석
3. SEO 최적화 방안
4. 콘텐츠 전략 제안

전문적이고 실용적인 관점에서 분석해주세요.`;
      break;
    case 'traffic-analysis':
      promptTemplate = `당신은 20년 경력의 트래픽 분석 전문가입니다. 트래픽 소스 분석 데이터를 바탕으로 채널 최적화 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- 트래픽 소스 데이터: {trafficData}

**분석 요청:**
1. 채널별 성과 분석
2. 트래픽 품질 평가
3. 채널 최적화 방안
4. 예산 배분 전략

전문적이고 실용적인 관점에서 분석해주세요.`;
      break;
    case 'gtm-analysis':
      promptTemplate = `당신은 20년 경력의 GTM/데이터 분석 전문가입니다. GTM 분석 데이터를 바탕으로 태그 관리 및 전환 최적화 인사이트를 제공해주세요:

**분석 데이터:**
- 기간: {dateRange}
- GTM 분석 데이터: {gtmData}

**분석 요청:**
1. 이벤트 추적 현황 분석
2. 전환 퍼널 최적화 방안
3. 태그 관리 개선점
4. 데이터 품질 향상 방안

전문적이고 실용적인 관점에서 분석해주세요.`;
      break;
    default:
      promptTemplate = `당신은 20년 경력의 데이터 분석 전문가입니다. 다음 데이터를 분석하여 인사이트를 제공해주세요:

**분석 데이터:**
{data}

**분석 요청:**
1. 핵심 인사이트 도출
2. 개선 방안 제시
3. 실용적인 액션 아이템

전문적이고 실용적인 관점에서 분석해주세요.`;
  }
} 