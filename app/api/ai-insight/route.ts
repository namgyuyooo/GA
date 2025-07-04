import { NextRequest, NextResponse } from 'next/server'
import { runGeminiPrompt, getBestFreeGeminiModel } from '../../../lib/geminiClient'

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
  'sessions': '다음은 세션 분석 데이터입니다. 총 세션, 평균 세션 시간, 세션당 페이지뷰, 이탈률, 시간대별 세션 분포, 기기별 세션, 지역별 세션 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'users': '다음은 사용자 분석 데이터입니다. 총 사용자, 신규 사용자, 재방문 사용자, 신규 사용자 비율, 사용자 획득 채널, 신규 vs 재방문 사용자 추이, 사용자 참여도, 사용자 세분화 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'pageviews': '다음은 페이지뷰 분석 데이터입니다. 총 페이지뷰, 순 페이지뷰, 평균 페이지 체류시간, 페이지별 전환율, 인기 페이지, 페이지 카테고리별 조회수, 페이지 성능 지표, 페이지 플로우 분석 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'conversions': '다음은 전환 분석 데이터입니다. 총 전환수, 전환율, 전환 가치, 평균 주문 가치, 전환 이벤트별 성과, 트래픽 소스별 전환 성과 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'traffic': '다음은 트래픽 소스 분석 주요 데이터입니다. 주요 소스/매체/캠페인별 세션, 전환 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'utm-cohort': '다음은 UTM 코호트 분석 주요 데이터입니다. 주요 리텐션, 전환, LTV 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'keyword-cohort': '다음은 키워드 코호트 분석 주요 데이터입니다. 주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.',
  'user-journey': '다음은 사용자 여정 분석 데이터입니다. 페이지 전환, 체류 시간, 스크롤 깊이, 재방문율, 사용자 행동 패턴, 유입 경로, 이탈/전환 목표 등을 바탕으로 3가지 핵심 인사이트와 2가지 UX 최적화 제안을 한국어로 요약해줘.',
  'weekly-report': '다음은 주간 분석 보고서 데이터입니다. 주요 성과 요약, 핵심 인사이트, 개선 영역, 다음 주 주목할 점을 포함한 주간 보고서를 작성해주세요.',
  'monthly-report': '다음은 월간 분석 보고서 데이터입니다. 월간 성과 요약, 주요 성장 영역, 개선 영역, 다음 달 전략을 포함한 월간 보고서를 작성해주세요.',
  'prediction': '다음은 과거 데이터입니다. 이 데이터를 기반으로 미래 트렌드를 예측하고, 예상되는 변화에 대한 3가지 인사이트를 한국어로 요약해줘.',
  'simulation': '다음은 시뮬레이션 데이터입니다. 주어진 변수 변화에 따른 예상 결과를 분석하고, 3가지 시뮬레이션 결과 인사이트와 2가지 전략적 제안을 한국어로 요약해줘.'
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, type, propertyId, templateId, variables } = await request.json()
    
    if (!type || !propertyId) {
      return NextResponse.json({ success: false, error: 'type, propertyId가 필요합니다.' }, { status: 400 })
    }

    let finalPrompt = prompt
    
    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()
    
    // 템플릿 ID가 제공된 경우 템플릿 사용
    if (templateId) {
      const templateResult = await client.query(
        `SELECT "id", "prompt", "isActive" FROM "PromptTemplate" WHERE "id" = $1`,
        [templateId]
      )
      
      if (templateResult.rows.length > 0) {
        const template = templateResult.rows[0]
        if (template.isActive) {
          finalPrompt = replaceTemplateVariables(template.prompt, variables || {})
        } else {
          await client.end()
          return NextResponse.json({ success: false, error: '유효하지 않은 템플릿입니다.' }, { status: 400 })
        }
      } else {
        await client.end()
        return NextResponse.json({ success: false, error: '템플릿을 찾을 수 없습니다.' }, { status: 404 })
      }
    } else if (!prompt) {
      // 프롬프트가 없으면 타입별 기본 프롬프트 사용
      finalPrompt = DEFAULT_PROMPTS[type as keyof typeof DEFAULT_PROMPTS] || '주요 데이터를 바탕으로 인사이트를 생성해주세요.'
    }

    const selectedModel = model || (await getBestFreeGeminiModel())
    const result = await runGeminiPrompt(finalPrompt, undefined, selectedModel)
    
    // DB 저장
    const savedResult = await client.query(
      `INSERT INTO "Insight" ("id", "type", "propertyId", "model", "prompt", "result", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING "id", "type", "propertyId", "model", "createdAt"`,
      [type, propertyId, selectedModel, finalPrompt, result]
    )

    await client.end()
    
    return NextResponse.json({ 
      success: true, 
      insight: result, 
      saved: savedResult.rows[0] 
    })
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
    
    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()
    
    const latestResult = await client.query(
      `SELECT "id", "type", "propertyId", "model", "prompt", "result", "createdAt", "updatedAt"
       FROM "Insight" 
       WHERE "type" = $1 AND "propertyId" = $2 
       ORDER BY "createdAt" DESC 
       LIMIT 1`,
      [type, propertyId]
    )

    await client.end()
    
    const latest = latestResult.rows.length > 0 ? latestResult.rows[0] : null
    
    return NextResponse.json({ success: true, insight: latest })
  } catch (e: any) {
    console.error('인사이트 조회 오류:', e)
    return NextResponse.json({ success: false, error: e.message || '인사이트 조회 실패' }, { status: 500 })
  }
} 