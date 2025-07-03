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