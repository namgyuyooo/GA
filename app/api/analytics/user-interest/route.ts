import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// 사용자 관심도 및 전환 가능성 분석 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || '464147982'
    const period = searchParams.get('period') || '30daysAgo'

    // 기간 파싱
    const daysAgo = parseInt(period.replace('daysAgo', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // 사용자 관심도 프로필 조회
    const interestProfiles = await prisma.userInterestProfile.findMany({
      where: {
        propertyId,
        profileDate: {
          gte: startDate,
        },
      },
      orderBy: [{ conversionProbability: 'desc' }, { engagementScore: 'desc' }],
    })

    // 전환 가능성별 사용자 분류
    const highPotential = interestProfiles.filter((p) => p.conversionProbability >= 0.7)
    const mediumPotential = interestProfiles.filter(
      (p) => p.conversionProbability >= 0.4 && p.conversionProbability < 0.7
    )
    const lowPotential = interestProfiles.filter((p) => p.conversionProbability < 0.4)

    // 관심도 높은 키워드 분석
    const keywordInterest = new Map()
    interestProfiles.forEach((profile) => {
      if (profile.entryKeyword && profile.conversionProbability > 0.3) {
        const keyword = profile.entryKeyword
        if (!keywordInterest.has(keyword)) {
          keywordInterest.set(keyword, {
            keyword,
            totalVisits: 0,
            highPotentialVisits: 0,
            avgEngagement: 0,
            avgConversionProbability: 0,
            avgPageViews: 0,
            avgSessionDuration: 0,
            returnVisits: 0,
          })
        }
        const stats = keywordInterest.get(keyword)
        stats.totalVisits++
        if (profile.conversionProbability >= 0.7) stats.highPotentialVisits++
        stats.avgEngagement += profile.engagementScore
        stats.avgConversionProbability += profile.conversionProbability
        stats.avgPageViews += profile.pageViews
        stats.avgSessionDuration += profile.sessionDuration
        stats.returnVisits += profile.returnVisitCount
      }
    })

    // 평균 계산
    keywordInterest.forEach((stats) => {
      if (stats.totalVisits > 0) {
        stats.avgEngagement = stats.avgEngagement / stats.totalVisits
        stats.avgConversionProbability = stats.avgConversionProbability / stats.totalVisits
        stats.avgPageViews = stats.avgPageViews / stats.totalVisits
        stats.avgSessionDuration = Math.round(stats.avgSessionDuration / stats.totalVisits)
        stats.returnVisits = stats.returnVisits / stats.totalVisits
      }
    })

    // 페이지별 관심도 분석
    const pageInterest = new Map()
    interestProfiles.forEach((profile) => {
      try {
        const pageSequence =
          typeof profile.pageSequence === 'string'
            ? profile.pageSequence
            : JSON.stringify(profile.pageSequence)
        const pages = JSON.parse(pageSequence || '[]')
        pages.forEach((pageInfo) => {
          const page = pageInfo.page || pageInfo
          if (!pageInterest.has(page)) {
            pageInterest.set(page, {
              page,
              visits: 0,
              highPotentialVisits: 0,
              avgEngagement: 0,
              avgTimeOnPage: 0,
              bounceRate: 0,
              conversionProximity: 0,
            })
          }
          const stats = pageInterest.get(page)
          stats.visits++
          if (profile.conversionProbability >= 0.7) stats.highPotentialVisits++
          stats.avgEngagement += profile.engagementScore
          stats.conversionProximity += profile.goalProximityScore
        })
      } catch (e) {
        console.error('Error parsing page sequence:', e)
      }
    })

    // 페이지 통계 계산
    pageInterest.forEach((stats) => {
      if (stats.visits > 0) {
        stats.avgEngagement = stats.avgEngagement / stats.visits
        stats.conversionProximity = stats.conversionProximity / stats.visits
        stats.conversionPotential = (stats.highPotentialVisits / stats.visits) * 100
      }
    })

    // 재방문자 분석
    const returningVisitors = interestProfiles.filter((p) => p.returnVisitCount > 0)
    const returningVisitorStats = {
      totalReturningVisitors: returningVisitors.length,
      avgReturnVisits:
        returningVisitors.length > 0
          ? returningVisitors.reduce((sum, p) => sum + p.returnVisitCount, 0) /
            returningVisitors.length
          : 0,
      avgConversionProbability:
        returningVisitors.length > 0
          ? returningVisitors.reduce((sum, p) => sum + p.conversionProbability, 0) /
            returningVisitors.length
          : 0,
      topReturningKeywords: Array.from(keywordInterest.values())
        .filter((k) => k.returnVisits > 0)
        .sort((a, b) => b.returnVisits - a.returnVisits)
        .slice(0, 10),
    }

    // 이탈 위험도 분석
    const churnRiskUsers = interestProfiles
      .filter((p) => p.riskOfChurn >= 0.6)
      .sort((a, b) => b.riskOfChurn - a.riskOfChurn)
      .slice(0, 50)

    return NextResponse.json({
      success: true,
      summary: {
        totalProfiles: interestProfiles.length,
        highPotentialUsers: highPotential.length,
        mediumPotentialUsers: mediumPotential.length,
        lowPotentialUsers: lowPotential.length,
        avgConversionProbability:
          interestProfiles.length > 0
            ? interestProfiles.reduce((sum, p) => sum + p.conversionProbability, 0) /
              interestProfiles.length
            : 0,
        avgEngagementScore:
          interestProfiles.length > 0
            ? interestProfiles.reduce((sum, p) => sum + p.engagementScore, 0) /
              interestProfiles.length
            : 0,
      },
      potentialSegments: {
        high: {
          count: highPotential.length,
          avgPageViews:
            highPotential.length > 0
              ? highPotential.reduce((sum, p) => sum + p.pageViews, 0) / highPotential.length
              : 0,
          avgSessionDuration:
            highPotential.length > 0
              ? Math.round(
                  highPotential.reduce((sum, p) => sum + p.sessionDuration, 0) /
                    highPotential.length
                )
              : 0,
          topKeywords: Array.from(keywordInterest.values())
            .filter((k) => k.avgConversionProbability >= 0.7)
            .sort((a, b) => b.totalVisits - a.totalVisits)
            .slice(0, 10),
        },
        medium: {
          count: mediumPotential.length,
          avgPageViews:
            mediumPotential.length > 0
              ? mediumPotential.reduce((sum, p) => sum + p.pageViews, 0) / mediumPotential.length
              : 0,
          avgSessionDuration:
            mediumPotential.length > 0
              ? Math.round(
                  mediumPotential.reduce((sum, p) => sum + p.sessionDuration, 0) /
                    mediumPotential.length
                )
              : 0,
          topKeywords: Array.from(keywordInterest.values())
            .filter((k) => k.avgConversionProbability >= 0.4 && k.avgConversionProbability < 0.7)
            .sort((a, b) => b.totalVisits - a.totalVisits)
            .slice(0, 10),
        },
        low: {
          count: lowPotential.length,
          avgPageViews:
            lowPotential.length > 0
              ? lowPotential.reduce((sum, p) => sum + p.pageViews, 0) / lowPotential.length
              : 0,
          avgSessionDuration:
            lowPotential.length > 0
              ? Math.round(
                  lowPotential.reduce((sum, p) => sum + p.sessionDuration, 0) / lowPotential.length
                )
              : 0,
        },
      },
      keywordAnalysis: Array.from(keywordInterest.values())
        .sort((a, b) => b.avgConversionProbability - a.avgConversionProbability)
        .slice(0, 20),
      pageAnalysis: Array.from(pageInterest.values())
        .sort((a, b) => b.conversionPotential - a.conversionPotential)
        .slice(0, 15),
      returningVisitorStats,
      churnRiskAnalysis: {
        totalAtRisk: churnRiskUsers.length,
        criticalUsers: churnRiskUsers.slice(0, 10),
        commonChurnPatterns: analyzeChurnPatterns(churnRiskUsers),
      },
      recommendations: generateRecommendations(
        Array.from(keywordInterest.values()),
        Array.from(pageInterest.values()),
        returningVisitorStats
      ),
    })
  } catch (error: any) {
    console.error('User interest analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze user interest data',
        details: error.message,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 사용자 관심도 데이터 수집 및 분석
export async function POST(request: NextRequest) {
  try {
    const { propertyId = '464147982' } = await request.json()

    // GA4에서 사용자 행동 데이터 수집
    const userData = await fetchUserBehaviorData(propertyId)

    // 관심도 프로필 계산 및 저장
    let savedCount = 0
    for (const userProfile of userData) {
      try {
        const profile = calculateInterestProfile(userProfile)

        await prisma.userInterestProfile.upsert({
          where: {
            sessionId_propertyId: {
              sessionId: profile.sessionId,
              propertyId,
            },
          },
          update: {
            ...profile,
            updatedAt: new Date(),
          },
          create: {
            ...profile,
            propertyId,
          },
        })
        savedCount++
      } catch (error) {
        console.error('Error saving user interest profile:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${savedCount}개의 사용자 관심도 프로필이 저장되었습니다.`,
      recordsSaved: savedCount,
    })
  } catch (error: any) {
    console.error('User interest collection error:', error)
    return NextResponse.json(
      {
        error: 'Failed to collect user interest data',
        details: error.message,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 이탈 패턴 분석
function analyzeChurnPatterns(churnUsers) {
  const patterns = {
    shortSessions: churnUsers.filter((u) => u.sessionDuration < 30).length,
    lowPageViews: churnUsers.filter((u) => u.pageViews <= 1).length,
    lowEngagement: churnUsers.filter((u) => u.engagementScore < 0.3).length,
    commonExitPages: [],
  }

  // 공통 이탈 페이지 분석
  const exitPages = new Map()
  churnUsers.forEach((user) => {
    try {
      const pages = JSON.parse(user.pageSequence || '[]')
      if (pages.length > 0) {
        const lastPage = pages[pages.length - 1].page || pages[pages.length - 1]
        if (!exitPages.has(lastPage)) {
          exitPages.set(lastPage, 0)
        }
        exitPages.set(lastPage, exitPages.get(lastPage) + 1)
      }
    } catch (e) {}
  })

  patterns.commonExitPages = Array.from(exitPages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([page, count]) => ({ page, count }))

  return patterns
}

// 권장사항 생성
function generateRecommendations(keywordData, pageData, returningStats) {
  const recommendations = []

  // 고전환 가능성 키워드 권장
  const topKeywords = keywordData.filter((k) => k.avgConversionProbability > 0.6).slice(0, 5)

  if (topKeywords.length > 0) {
    recommendations.push({
      type: 'keyword_optimization',
      priority: 'high',
      title: '고전환 가능성 키워드 집중 마케팅',
      description: `${topKeywords.map((k) => k.keyword).join(', ')} 키워드로 유입되는 사용자들의 전환 가능성이 높습니다.`,
      action: 'SEO 최적화 및 광고 예산 증대 검토',
    })
  }

  // 페이지 개선 권장
  const improvementPages = pageData
    .filter((p) => p.visits > 10 && p.conversionPotential < 30)
    .slice(0, 3)

  if (improvementPages.length > 0) {
    recommendations.push({
      type: 'page_optimization',
      priority: 'medium',
      title: '페이지 전환율 개선 필요',
      description: `${improvementPages.map((p) => p.page).join(', ')} 페이지의 전환 잠재력이 낮습니다.`,
      action: 'UX/UI 개선, CTA 버튼 최적화 검토',
    })
  }

  // 재방문자 활용 권장
  if (returningStats.avgConversionProbability > 0.5) {
    recommendations.push({
      type: 'retention_strategy',
      priority: 'high',
      title: '재방문자 타겟 마케팅 강화',
      description: `재방문자들의 전환 가능성이 ${(returningStats.avgConversionProbability * 100).toFixed(1)}%로 높습니다.`,
      action: '리타겟팅 광고 및 이메일 마케팅 강화',
    })
  }

  return recommendations
}

// GA4에서 사용자 행동 데이터 수집
async function fetchUserBehaviorData(propertyId: string) {
  const fs = require('fs')
  const path = require('path')

  const serviceAccountPath = path.join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json')
  const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
  const serviceAccount = JSON.parse(serviceAccountData)

  const jwt = require('jsonwebtoken')
  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign(
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    serviceAccount.private_key,
    { algorithm: 'RS256' }
  )

  const authResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  })

  const tokenData = await authResponse.json()
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token for GA4')
  }

  // 상세한 사용자 행동 데이터 조회
  const gaResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'sessionId' },
          { name: 'userId' },
          { name: 'date' },
          { name: 'pagePath' },
          { name: 'eventName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' },
          { name: 'eventCount' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        limit: 5000,
      }),
    }
  )

  if (!gaResponse.ok) {
    throw new Error(`GA4 API error: ${gaResponse.status}`)
  }

  const gaData = await gaResponse.json()

  // 세션별로 데이터 그룹화
  const sessionData = new Map()

  for (const row of gaData.rows || []) {
    const sessionId = row.dimensionValues[0].value
    const userId = row.dimensionValues[1].value
    const date = row.dimensionValues[2].value
    const pagePath = row.dimensionValues[3].value
    const eventName = row.dimensionValues[4].value
    const source = row.dimensionValues[5].value
    const medium = row.dimensionValues[6].value

    const pageViews = Number(row.metricValues[0].value)
    const engagementDuration = Number(row.metricValues[1].value)
    const eventCount = Number(row.metricValues[2].value)
    const sessionDuration = Number(row.metricValues[4].value)

    if (!sessionData.has(sessionId)) {
      sessionData.set(sessionId, {
        sessionId,
        userId,
        date,
        source,
        medium,
        pages: [],
        events: [],
        totalPageViews: 0,
        totalEngagementDuration: 0,
        totalEvents: 0,
        sessionDuration: sessionDuration,
      })
    }

    const session = sessionData.get(sessionId)
    session.pages.push({ page: pagePath, timestamp: date })
    session.events.push({ event: eventName, page: pagePath, timestamp: date })
    session.totalPageViews += pageViews
    session.totalEngagementDuration += engagementDuration
    session.totalEvents += eventCount
  }

  return Array.from(sessionData.values())
}

// 관심도 프로필 계산
function calculateInterestProfile(userData) {
  const profile: any = {
    sessionId: userData.sessionId,
    userId: userData.userId,
    profileDate: new Date(userData.date),
    entryKeyword: null, // GSC 연계 필요
    entrySource: userData.source,
    entryMedium: userData.medium,
    entryPage: userData.pages[0]?.page || '/',
    sessionDuration: userData.sessionDuration,
    pageViews: userData.totalPageViews,
    totalEvents: userData.totalEvents,
    scrollDepth: Math.random() * 0.8 + 0.2, // 실제로는 scroll 이벤트에서 계산
    pageSequence: JSON.stringify(userData.pages),
    eventSequence: JSON.stringify(userData.events),
    visitPattern: analyzeVisitPattern(userData),
    interestedGoals: JSON.stringify([]), // Goal 매칭 로직 필요
    returnVisitCount: 0, // 사용자 히스토리에서 계산 필요
  }

  // 관심도 점수 계산
  profile.goalProximityScore = calculateGoalProximity(userData)
  profile.engagementScore = calculateEngagementScore(userData)
  profile.conversionProbability = calculateConversionProbability(profile)
  profile.riskOfChurn = calculateChurnRisk(profile)

  return profile
}

function analyzeVisitPattern(userData) {
  const patterns = []

  if (userData.totalPageViews === 1) patterns.push('bounce')
  if (userData.totalPageViews > 5) patterns.push('explorer')
  if (userData.sessionDuration > 300) patterns.push('engaged')
  if (userData.totalEvents > 10) patterns.push('interactive')

  return JSON.stringify(patterns)
}

function calculateGoalProximity(userData) {
  // Goal 페이지나 이벤트와의 근접성 계산
  const goalPages = ['/contact', '/download', '/demo', '/pricing']
  const visitedGoalPages = userData.pages.filter((p) =>
    goalPages.some((gp) => p.page.includes(gp))
  ).length

  return Math.min(visitedGoalPages / goalPages.length, 1.0)
}

function calculateEngagementScore(userData) {
  const pageViewScore = Math.min(userData.totalPageViews / 10, 1.0) * 0.3
  const durationScore = Math.min(userData.sessionDuration / 600, 1.0) * 0.4
  const eventScore = Math.min(userData.totalEvents / 20, 1.0) * 0.3

  return pageViewScore + durationScore + eventScore
}

function calculateConversionProbability(profile) {
  const engagementWeight = profile.engagementScore * 0.4
  const proximityWeight = profile.goalProximityScore * 0.3
  const pageViewWeight = Math.min(profile.pageViews / 5, 1.0) * 0.2
  const durationWeight = Math.min(profile.sessionDuration / 300, 1.0) * 0.1

  return Math.min(engagementWeight + proximityWeight + pageViewWeight + durationWeight, 1.0)
}

function calculateChurnRisk(profile) {
  let risk = 0

  if (profile.pageViews === 1) risk += 0.4
  if (profile.sessionDuration < 30) risk += 0.3
  if (profile.engagementScore < 0.2) risk += 0.2
  if (profile.totalEvents < 2) risk += 0.1

  return Math.min(risk, 1.0)
}
