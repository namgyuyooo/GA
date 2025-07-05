import { NextRequest, NextResponse } from 'next/server'
import { runGeminiPrompt, getBestFreeGeminiModel } from '../../../lib/geminiClient'
import { PrismaClient } from '@prisma/client'
import { CacheService } from '../../../lib/cacheService'

const prisma = new PrismaClient()

// 프롬프트 템플릿에서 변수를 실제 값으로 치환
function replaceTemplateVariables(template: string, variables: any): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value))
  }
  return result
}

// 타입별 기본 프롬프트 매핑 (주간 변화율 포함)
const DEFAULT_PROMPTS = {
  dashboard:
    '다음은 대시보드 주요 데이터입니다. {weeklyData} 이 데이터를 바탕으로 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘. 각 주차별 변화율을 명시하고 트렌드를 분석해줘.',
  sessions:
    '다음은 세션 분석 데이터입니다. {weeklyData} 이 데이터를 바탕으로 총 세션, 평균 세션 시간, 세션당 페이지뷰, 이탈률, 시간대별 세션 분포, 기기별 세션, 지역별 세션 등 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  users:
    '다음은 사용자 분석 데이터입니다. {weeklyData} 이 데이터를 바탕으로 총 사용자, 신규 사용자, 재방문 사용자, 신규 사용자 비율, 사용자 획득 채널, 신규 vs 재방문 사용자 추이, 사용자 참여도, 사용자 세분화 등 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  pageviews:
    '다음은 페이지뷰 분석 데이터입니다. {weeklyData} 이 데이터를 바탕으로 총 페이지뷰, 순 페이지뷰, 평균 페이지 체류시간, 페이지별 전환율, 인기 페이지, 페이지 카테고리별 조회수, 페이지 성능 지표, 페이지 플로우 분석 등 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  conversions:
    '다음은 전환 분석 데이터입니다. {weeklyData} 이 데이터를 바탕으로 총 전환수, 전환율, 전환 가치, 평균 주문 가치, 전환 이벤트별 성과, 트래픽 소스별 전환 성과 등 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  traffic:
    '다음은 트래픽 소스 분석 주요 데이터입니다. {weeklyData} 이 데이터를 바탕으로 주요 소스/매체/캠페인별 세션, 전환 등 주요 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'utm-cohort':
    '다음은 UTM 코호트 분석 주요 데이터입니다. {weeklyData} 이 데이터를 바탕으로 주요 리텐션, 전환, LTV 등 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'keyword-cohort':
    '다음은 키워드 코호트 분석 주요 데이터입니다. {weeklyData} 이 데이터를 바탕으로 주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표의 지난 4주간 주간 변화율을 분석하고, 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'user-journey':
    '다음은 사용자 여정 분석 데이터입니다. {weeklyData} 이 데이터를 바탕으로 페이지 전환, 체류 시간, 스크롤 깊이, 재방문율, 사용자 행동 패턴, 유입 경로, 이탈/전환 목표 등을 바탕으로 3가지 핵심 인사이트와 2가지 UX 최적화 제안을 한국어로 요약해줘.',
  comprehensive:
    '다음은 종합적인 웹사이트 분석 데이터입니다. {weeklyData} 이 데이터는 사용자, 세션, 페이지뷰, 전환, 트래픽 소스, UTM 코호트, 키워드 등 모든 주요 지표를 포함합니다. 지난 4주간의 주간 변화율과 트렌드를 종합적으로 분석하여 다음 항목들을 포함한 포괄적인 인사이트를 한국어로 작성해주세요: 1) 전체 성과 요약 (5가지 핵심 지표), 2) 주요 성장 영역 (3가지), 3) 개선이 필요한 영역 (3가지), 4) 주간 트렌드 분석, 5) 전략적 제안사항 (5가지)',
  'weekly-report':
    '다음은 주간 분석 보고서 데이터입니다. {weeklyData} 이 데이터를 바탕으로 주요 성과 요약, 핵심 인사이트, 개선 영역, 다음 주 주목할 점을 포함한 주간 보고서를 작성해주세요.',
  'monthly-report':
    '다음은 월간 분석 보고서 데이터입니다. {weeklyData} 이 데이터를 바탕으로 월간 성과 요약, 주요 성장 영역, 개선 영역, 다음 달 전략을 포함한 월간 보고서를 작성해주세요.',
}

export async function POST(request: NextRequest) {
  try {
    let {
      prompt,
      model,
      type,
      propertyId,
      templateId,
      variables,
      weeklyData,
      isComprehensive = false,
      sourceInsightTypes = [],
    } = await request.json()

    if (!type || !propertyId) {
      return NextResponse.json(
        { success: false, error: 'type, propertyId가 필요합니다.' },
        { status: 400 }
      )
    }

    // Fetch Gemini config from DB
    const geminiConfig = await prisma.setting.findUnique({
      where: { key: 'geminiConfig' },
    })
    const parsedGeminiConfig = geminiConfig ? JSON.parse(geminiConfig.value) : {}

    // Use preferred model from config if available and not explicitly provided in request
    let selectedModel =
      model ||
      parsedGeminiConfig.selectedGeminiModel ||
      (await getBestFreeGeminiModel(
        parsedGeminiConfig.geminiModelPriority
          ? parsedGeminiConfig.geminiModelPriority.split(',').map((s: string) => s.trim())
          : undefined
      ))

    let finalPrompt = prompt
    let finalTemplateId = templateId

    // Use default prompt template from config if available and not explicitly provided in request
    if (!finalTemplateId && parsedGeminiConfig.selectedDefaultPromptTemplateId) {
      finalTemplateId = parsedGeminiConfig.selectedDefaultPromptTemplateId
    }

    // 종합 인사이트 생성인 경우
    if (isComprehensive) {
      const comprehensiveData = await generateComprehensiveData(propertyId, sourceInsightTypes)
      weeklyData = comprehensiveData.data

      // 종합 인사이트용 프롬프트 사용
      finalPrompt = finalPrompt || DEFAULT_PROMPTS.comprehensive

      // 종합 데이터로 변수 치환
      finalPrompt = replaceTemplateVariables(finalPrompt, {
        weeklyData: JSON.stringify(comprehensiveData.data),
        ...variables,
      })
    } else {
      // 개별 인사이트인 경우 주간 변화율 데이터 생성
      if (!weeklyData) {
        const weeklyTrends = await CacheService.calculateWeeklyTrends(propertyId, type)
        weeklyData = weeklyTrends
      }

      // 템플릿 ID가 제공된 경우 템플릿 사용
      if (finalTemplateId) {
        const templateResult = await prisma.promptTemplate.findUnique({
          where: { id: finalTemplateId },
        })

        if (templateResult) {
          const template = templateResult
          if (template.isActive) {
            finalPrompt = replaceTemplateVariables(template.prompt, {
              weeklyData: JSON.stringify(weeklyData),
              ...variables,
            })
          } else {
            return NextResponse.json(
              { success: false, error: '유효하지 않은 템플릿입니다.' },
              { status: 400 }
            )
          }
        } else {
          return NextResponse.json(
            { success: false, error: '템플릿을 찾을 수 없습니다.' },
            { status: 404 }
          )
        }
      } else if (!prompt) {
        // 프롬프트가 없으면 타입별 기본 프롬프트 사용
        finalPrompt =
          DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS] ||
          '주요 데이터를 바탕으로 인사이트를 생성해주세요.'

        finalPrompt = replaceTemplateVariables(finalPrompt, {
          weeklyData: JSON.stringify(weeklyData),
          ...variables,
        })
      }
    }

    const result = await runGeminiPrompt(finalPrompt, weeklyData, selectedModel)

    // 분석 시점 계산
    const analysisEndDate = new Date()
    const analysisStartDate = new Date()
    analysisStartDate.setDate(analysisStartDate.getDate() - 28) // 4주 전

    // 데이터 소스 타입 결정
    const dataSourceTypes = determineDataSourceTypes(type, isComprehensive, sourceInsightTypes)

    // 종합 인사이트인 경우 참조한 개별 인사이트 ID들 수집
    let sourceInsightIds: string[] = []
    if (isComprehensive) {
      sourceInsightIds = await getSourceInsightIds(propertyId, sourceInsightTypes)
    }

    // DB 저장 (개선된 구조)
    const savedResult = await prisma.insight.create({
      data: {
        type,
        propertyId,
        model: selectedModel,
        prompt: finalPrompt,
        result,
        dataSourceTypes: dataSourceTypes,
        analysisStartDate,
        analysisEndDate,
        sourceInsightIds: isComprehensive ? sourceInsightIds : null,
        isComprehensive,
        weeklyTrend: weeklyData,
      },
    })

    return NextResponse.json({
      success: true,
      insight: result,
      saved: savedResult,
      metadata: {
        analysisStartDate,
        analysisEndDate,
        dataSourceTypes,
        fromCache: false,
        isComprehensive,
        sourceInsightCount: sourceInsightIds.length,
      },
    })
  } catch (e: any) {
    console.error('AI 인사이트 생성 오류:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'AI 인사이트 생성 실패' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const propertyId = searchParams.get('propertyId')
    const comprehensive = searchParams.get('comprehensive') === 'true'

    if (!propertyId) {
      return NextResponse.json({ success: false, error: 'propertyId 쿼리 필요' }, { status: 400 })
    }

    let whereClause: any = { propertyId }

    if (comprehensive) {
      whereClause.isComprehensive = true
    } else if (type) {
      whereClause.type = type
      whereClause.isComprehensive = false
    }

    const latestResult = await prisma.insight.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    const latest = latestResult || null

    // 추가 메타데이터 제공
    const metadata = latest
      ? {
          analysisStartDate: latest.analysisStartDate,
          analysisEndDate: latest.analysisEndDate,
          dataSourceTypes: latest.dataSourceTypes,
          isComprehensive: latest.isComprehensive,
          sourceInsightCount: latest.sourceInsightIds
            ? (latest.sourceInsightIds as string[]).length
            : 0,
        }
      : null

    return NextResponse.json({
      success: true,
      insight: latest,
      metadata,
    })
  } catch (e: any) {
    console.error('인사이트 조회 오류:', e)
    return NextResponse.json(
      { success: false, error: e.message || '인사이트 조회 실패' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 종합 인사이트용 데이터 생성
async function generateComprehensiveData(propertyId: string, sourceTypes: string[]) {
  const comprehensiveData: any = {
    overview: '종합 웹사이트 분석 데이터',
    propertyId,
    analysisDate: new Date().toISOString(),
    sourceTypes,
  }

  // 각 분석 타입별 최신 인사이트와 주간 변화율 데이터 수집
  for (const sourceType of sourceTypes) {
    try {
      // 최신 인사이트 조회
      const latestInsight = await prisma.insight.findFirst({
        where: {
          propertyId,
          type: sourceType,
          isComprehensive: false,
        },
        orderBy: { createdAt: 'desc' },
      })

      // 주간 변화율 데이터 조회
      const weeklyTrend = await prisma.weeklyTrendData.findUnique({
        where: {
          propertyId_dataType: {
            propertyId,
            dataType: sourceType,
          },
        },
      })

      comprehensiveData[sourceType] = {
        insight: latestInsight?.result || '데이터 없음',
        weeklyTrend: weeklyTrend || null,
        lastAnalysis: latestInsight?.createdAt || null,
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${sourceType}:`, error)
      comprehensiveData[sourceType] = {
        insight: '데이터 로드 실패',
        weeklyTrend: null,
        lastAnalysis: null,
      }
    }
  }

  return { data: comprehensiveData }
}

// 데이터 소스 타입 결정
function determineDataSourceTypes(
  type: string,
  isComprehensive: boolean,
  sourceTypes: string[]
): string[] {
  if (isComprehensive) {
    const allSources = new Set<string>()

    for (const sourceType of sourceTypes) {
      const sources = getDataSourcesForType(sourceType)
      sources.forEach((source) => allSources.add(source))
    }

    return Array.from(allSources)
  }

  return getDataSourcesForType(type)
}

// 타입별 데이터 소스 매핑
function getDataSourcesForType(type: string): string[] {
  const sourceMap: Record<string, string[]> = {
    dashboard: ['ga4'],
    users: ['ga4'],
    sessions: ['ga4'],
    pageviews: ['ga4'],
    conversions: ['ga4', 'gtm'],
    traffic: ['ga4'],
    'utm-cohort': ['ga4'],
    'keyword-cohort': ['gsc', 'ga4'],
    'user-journey': ['ga4'],
  }

  return sourceMap[type] || ['ga4']
}

// 참조한 개별 인사이트 ID들 수집
async function getSourceInsightIds(propertyId: string, sourceTypes: string[]): Promise<string[]> {
  const insights = await prisma.insight.findMany({
    where: {
      propertyId,
      type: { in: sourceTypes },
      isComprehensive: false,
    },
    orderBy: { createdAt: 'desc' },
    take: sourceTypes.length, // 각 타입별 최신 1개씩
    select: { id: true },
  })

  return insights.map((insight) => insight.id)
}
