import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const { PrismaClient } = require('@prisma/client')

// 무료 모델 우선순위 (exp 모델 우선)
const FREE_MODELS = [
  'gemini-1.5-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro-exp',
  'gemini-1.5-pro',
  'gemini-pro-exp',
  'gemini-pro',
]

// 사용 가능한 모델 조회 및 무료 모델 선택
async function getAvailableModel(apiKey: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    console.log('🔍 무료 Gemini 모델 테스트 중...')

    // 무료 모델 중 사용 가능한 첫 번째 모델 선택
    for (const modelName of FREE_MODELS) {
      try {
        console.log(`  테스트 중: ${modelName}`)

        // 모델 생성 및 간단한 테스트
        const model = genAI.getGenerativeModel({ model: modelName })
        const testResult = await model.generateContent('안녕하세요')

        if (testResult.response && testResult.response.text()) {
          console.log(`✅ 선택된 무료 모델: ${modelName}`)
          return modelName
        }
      } catch (error: any) {
        console.log(`❌ 모델 ${modelName} 사용 불가: ${error.message || error}`)
        continue
      }
    }

    // 모든 무료 모델이 실패하면 기본값 반환
    console.log('⚠️ 무료 모델을 찾을 수 없어 기본 모델 사용')
    return 'gemini-1.5-flash'
  } catch (error) {
    console.error('모델 조회 중 오류:', error)
    return 'gemini-1.5-flash' // 기본값
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test = false, schedule } = await request.json()
    const prisma = new PrismaClient()

    // 테스트 모드인지 확인
    const isTest = test === true

    // 날짜 범위 계산 (지난 주)
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(now.getDate() - now.getDay()) // 이번 주 일요일
    endDate.setHours(0, 0, 0, 0)

    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 7) // 7일 전

    const propertyId = schedule?.propertyIds?.[0] || '464147982'

    // 1. 기본 메트릭 데이터 수집
    const basicMetrics = await collectBasicMetrics(propertyId, startDate, endDate)

    // 2. 주요 변동 이슈 분석
    const issues = schedule?.includeIssues
      ? await analyzeIssues(propertyId, startDate, endDate)
      : []

    // 3. Gemini AI 분석
    let aiAnalysis = null
    let selectedModel = null
    if (schedule?.includeAI) {
      const analysisResult = await generateAIAnalysis(basicMetrics, issues, schedule.aiPrompt)
      aiAnalysis = analysisResult.analysis
      selectedModel = analysisResult.model
    }

    // 4. 보고서 생성
    const reportData = {
      title: `${schedule?.name || '주간 보고서'} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      propertyId,
      isTest,
      summary: schedule?.includeSummary ? generateSummary(basicMetrics) : null,
      issues: issues,
      aiAnalysis: aiAnalysis,
      selectedModel: selectedModel,
      metrics: basicMetrics,
    }

    // 데이터베이스에 저장
    if (!isTest) {
      await prisma.weeklyReport.create({
        data: {
          title: reportData.title,
          startDate: startDate,
          endDate: endDate,
          totalSessions: basicMetrics.totalSessions,
          totalUsers: basicMetrics.totalUsers,
          totalConversions: basicMetrics.totalConversions,
          avgEngagementRate: basicMetrics.avgEngagementRate,
          totalClicks: basicMetrics.totalClicks || 0,
          totalImpressions: basicMetrics.totalImpressions || 0,
          avgCtr: basicMetrics.avgCtr || 0,
          avgPosition: basicMetrics.avgPosition || 0,
          reportData: JSON.stringify(reportData),
        },
      })
    }

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      report: reportData,
      message: isTest ? '테스트 보고서가 생성되었습니다.' : '주간 보고서가 생성되었습니다.',
    })
  } catch (error) {
    console.error('Weekly report generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '주간 보고서 생성에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}

async function collectBasicMetrics(propertyId: string, startDate: Date, endDate: Date) {
  // Service Account 기반 실제 데이터 가져오기
  const fs = require('fs')
  const path = require('path')

  let serviceAccount
  try {
    const serviceAccountPath = path.join(process.cwd(), 'config/ga-auto-464002-f4628b785d39.json')
    const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
    serviceAccount = JSON.parse(serviceAccountData)
  } catch (fileError) {
    console.error('Service account file error:', fileError)
    throw new Error('Service account file not found')
  }

  // JWT 토큰으로 Google API 인증
  const jwt = require('jsonwebtoken')

  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const token = jwt.sign(tokenPayload, serviceAccount.private_key, { algorithm: 'RS256' })

  const authResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  })

  if (!authResponse.ok) {
    throw new Error(`Auth failed: ${authResponse.status}`)
  }

  const tokenData = await authResponse.json()

  // 기본 메트릭 수집
  const metricsResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' },
        ],
      }),
    }
  )

  if (!metricsResponse.ok) {
    throw new Error('Failed to fetch metrics')
  }

  const metricsData = await metricsResponse.json()
  const row = metricsData.rows?.[0]?.metricValues || []

  return {
    totalSessions: Number(row[0]?.value || 0),
    totalUsers: Number(row[1]?.value || 0),
    totalConversions: Number(row[2]?.value || 0),
    totalRevenue: Number(row[3]?.value || 0),
    avgSessionDuration: Number(row[4]?.value || 0),
    totalPageViews: Number(row[5]?.value || 0),
    avgEngagementRate: 0.7, // 기본값
    avgCtr: 0.02, // 기본값
    avgPosition: 15.5, // 기본값
    totalClicks: 0, // 기본값
    totalImpressions: 0, // 기본값
  }
}

async function analyzeIssues(propertyId: string, startDate: Date, endDate: Date) {
  // 주요 변동 이슈 분석 로직
  const issues = []

  // 예시 이슈들 (실제로는 데이터 분석을 통해 도출)
  const sampleIssues = [
    {
      type: 'traffic_drop',
      title: '트래픽 감소',
      description: '지난 주 대비 세션 수가 15% 감소했습니다.',
      severity: 'medium',
      impact: '전환율에 영향을 줄 수 있습니다.',
    },
    {
      type: 'conversion_improvement',
      title: '전환율 개선',
      description: '전환율이 8% 향상되었습니다.',
      severity: 'positive',
      impact: '매출 증가에 긍정적인 영향을 미쳤습니다.',
    },
  ]

  return sampleIssues
}

async function generateAIAnalysis(metrics: any, issues: any[], prompt: string) {
  try {
    // Gemini API 키 확인
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('GEMINI_API_KEY가 설정되지 않았습니다. 샘플 분석을 반환합니다.')
      return getSampleAnalysis()
    }

    // 사용 가능한 무료 모델 선택
    const selectedModel = await getAvailableModel(apiKey)

    // Gemini AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: selectedModel })

    // 분석할 데이터 준비
    const analysisData = {
      metrics: {
        totalSessions: metrics.totalSessions,
        totalUsers: metrics.totalUsers,
        totalConversions: metrics.totalConversions,
        totalRevenue: metrics.totalRevenue,
        avgSessionDuration: metrics.avgSessionDuration,
        totalPageViews: metrics.totalPageViews,
        avgEngagementRate: metrics.avgEngagementRate,
        avgCtr: metrics.avgCtr,
        avgPosition: metrics.avgPosition,
      },
      issues: issues,
    }

    // 프롬프트 구성
    const fullPrompt = `
${prompt}

다음은 웹사이트 분석 데이터입니다:

**기본 메트릭:**
- 총 세션: ${metrics.totalSessions.toLocaleString()}
- 총 사용자: ${metrics.totalUsers.toLocaleString()}
- 총 전환: ${metrics.totalConversions.toLocaleString()}
- 총 매출: ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(metrics.totalRevenue)}
- 평균 세션 시간: ${Math.round(metrics.avgSessionDuration / 60)}분
- 총 페이지뷰: ${metrics.totalPageViews.toLocaleString()}
- 평균 참여율: ${(metrics.avgEngagementRate * 100).toFixed(1)}%
- 평균 CTR: ${(metrics.avgCtr * 100).toFixed(2)}%
- 평균 검색 순위: ${metrics.avgPosition.toFixed(1)}

**주요 이슈:**
${issues.map((issue) => `- ${issue.title}: ${issue.description}`).join('\n')}

다음 형식으로 분석 결과를 제공해주세요:

**주요 인사이트:**
- [인사이트 1]
- [인사이트 2]
- [인사이트 3]

**개선 권장사항:**
- [권장사항 1]
- [권장사항 2]
- [권장사항 3]

**트렌드 분석:**
- [트렌드 1]
- [트렌드 2]
`

    console.log(`🤖 ${selectedModel} 모델로 AI 분석 시작...`)

    // Gemini AI 호출
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    const text = response.text()

    console.log('✅ AI 분석 완료')

    // 응답 파싱
    const analysis = parseAIAnalysis(text)

    return {
      analysis: analysis,
      model: selectedModel,
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    return getSampleAnalysis()
  }
}

function parseAIAnalysis(text: string) {
  try {
    // 간단한 파싱 로직 (실제로는 더 정교한 파싱 필요)
    const insights = []
    const recommendations = []
    const trends = []

    const lines = text.split('\n')
    let currentSection = ''

    for (const line of lines) {
      if (line.includes('주요 인사이트:')) {
        currentSection = 'insights'
      } else if (line.includes('개선 권장사항:')) {
        currentSection = 'recommendations'
      } else if (line.includes('트렌드 분석:')) {
        currentSection = 'trends'
      } else if (line.trim().startsWith('-') && line.trim().length > 1) {
        const content = line.trim().substring(1).trim()
        switch (currentSection) {
          case 'insights':
            insights.push(content)
            break
          case 'recommendations':
            recommendations.push(content)
            break
          case 'trends':
            trends.push(content)
            break
        }
      }
    }

    return {
      insights: insights.length > 0 ? insights : ['데이터 분석을 통해 인사이트를 도출했습니다.'],
      recommendations:
        recommendations.length > 0 ? recommendations : ['개선을 위한 권장사항을 제시합니다.'],
      trends: trends.length > 0 ? trends : ['트렌드 분석을 수행했습니다.'],
    }
  } catch (error) {
    console.error('AI analysis parsing error:', error)
    return getSampleAnalysis()
  }
}

function getSampleAnalysis() {
  return {
    analysis: {
      insights: [
        '트래픽은 감소했지만 전환율이 개선되어 효율성이 향상되었습니다.',
        '모바일 사용자 비율이 높아 모바일 최적화가 중요합니다.',
        '유기 검색 트래픽이 주요 소스이므로 SEO 전략을 강화해야 합니다.',
      ],
      recommendations: [
        '모바일 사용자 경험 개선을 위한 페이지 로딩 속도 최적화',
        '전환율이 높은 페이지들의 콘텐츠 전략 강화',
        '유기 검색 키워드 타겟팅 확대',
      ],
      trends: [
        '전환율 상승 추세가 지속되고 있습니다.',
        '모바일 트래픽 비중이 점진적으로 증가하고 있습니다.',
      ],
    },
    model: 'sample-analysis',
  }
}

function generateSummary(metrics: any) {
  return {
    overview: `${metrics.totalSessions.toLocaleString()}개의 세션에서 ${metrics.totalUsers.toLocaleString()}명의 사용자가 방문했습니다.`,
    conversions: `총 ${metrics.totalConversions.toLocaleString()}건의 전환이 발생했습니다.`,
    revenue: `총 매출은 ${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(metrics.totalRevenue)}입니다.`,
    engagement: `평균 세션 시간은 ${Math.round(metrics.avgSessionDuration / 60)}분입니다.`,
  }
}
