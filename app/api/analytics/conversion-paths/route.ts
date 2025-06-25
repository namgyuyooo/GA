import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// 전환 경로 분석 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || '464147982'
    const period = searchParams.get('period') || '30daysAgo'
    const goalId = searchParams.get('goalId')

    // 기간 파싱
    const daysAgo = parseInt(period.replace('daysAgo', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Goal 목록 조회 (goalId가 없으면 모든 활성 Goal)
    let goals
    if (goalId) {
      goals = await prisma.conversionGoal.findMany({
        where: { id: goalId, propertyId, isActive: true }
      })
    } else {
      goals = await prisma.conversionGoal.findMany({
        where: { propertyId, isActive: true },
        orderBy: { priority: 'asc' }
      })
    }

    if (goals.length === 0) {
      return NextResponse.json({
        success: false,
        message: '활성화된 전환 목표가 없습니다. 전환 목표를 먼저 설정해주세요.',
        goals: [],
        pathAnalysis: {},
        keywordAnalysis: {},
        pageJourneyAnalysis: {}
      })
    }

    // 각 Goal별 전환 경로 분석
    const pathAnalysis = {}
    const keywordAnalysis = {}
    const pageJourneyAnalysis = {}

    for (const goal of goals) {
      // 전환 경로 데이터 조회
      const conversionPaths = await prisma.conversionPath.findMany({
        where: {
          goalId: goal.id,
          conversionDate: {
            gte: startDate
          }
        },
        orderBy: { conversionDate: 'desc' }
      })

      // 1. 키워드별 전환 분석
      const keywordStats = new Map()
      conversionPaths.forEach(path => {
        if (path.entryKeyword) {
          const key = path.entryKeyword
          if (!keywordStats.has(key)) {
            keywordStats.set(key, {
              keyword: key,
              conversions: 0,
              totalRevenue: 0,
              avgSessionDuration: 0,
              avgPageViews: 0,
              conversionPaths: []
            })
          }
          const stats = keywordStats.get(key)
          stats.conversions++
          stats.totalRevenue += path.revenue
          stats.avgSessionDuration += path.sessionDuration
          stats.avgPageViews += path.pageViews
          stats.conversionPaths.push({
            entryPage: path.entryPage,
            pageSequence: JSON.parse(path.pageSequence || '[]'),
            conversionDate: path.conversionDate
          })
        }
      })

      // 평균 계산
      keywordStats.forEach(stats => {
        if (stats.conversions > 0) {
          stats.avgSessionDuration = Math.round(stats.avgSessionDuration / stats.conversions)
          stats.avgPageViews = Math.round(stats.avgPageViews / stats.conversions * 10) / 10
        }
      })

      keywordAnalysis[goal.id] = {
        goalName: goal.name,
        keywords: Array.from(keywordStats.values())
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 20)
      }

      // 2. 페이지 여정 분석
      const pageJourneys = new Map()
      const entryPages = new Map()
      
      conversionPaths.forEach(path => {
        // 진입 페이지 통계
        if (path.entryPage) {
          if (!entryPages.has(path.entryPage)) {
            entryPages.set(path.entryPage, { page: path.entryPage, conversions: 0, revenue: 0 })
          }
          const entry = entryPages.get(path.entryPage)
          entry.conversions++
          entry.revenue += path.revenue
        }

        // 페이지 시퀀스 분석
        try {
          const sequence = JSON.parse(path.pageSequence || '[]')
          if (sequence.length > 0) {
            const journeyKey = sequence.map(s => s.page).join(' → ')
            if (!pageJourneys.has(journeyKey)) {
              pageJourneys.set(journeyKey, {
                journey: journeyKey,
                steps: sequence.length,
                conversions: 0,
                avgDuration: 0,
                totalDuration: 0
              })
            }
            const journey = pageJourneys.get(journeyKey)
            journey.conversions++
            journey.totalDuration += path.sessionDuration
            journey.avgDuration = Math.round(journey.totalDuration / journey.conversions)
          }
        } catch (e) {
          console.error('Error parsing page sequence:', e)
        }
      })

      pageJourneyAnalysis[goal.id] = {
        goalName: goal.name,
        entryPages: Array.from(entryPages.values())
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 10),
        commonJourneys: Array.from(pageJourneys.values())
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 15),
        totalConversions: conversionPaths.length
      }

      // 3. 전환 경로 요약
      const sourceStats = new Map()
      conversionPaths.forEach(path => {
        const sourceKey = `${path.entrySource || 'direct'}/${path.entryMedium || 'none'}`
        if (!sourceStats.has(sourceKey)) {
          sourceStats.set(sourceKey, {
            source: path.entrySource || 'direct',
            medium: path.entryMedium || 'none',
            conversions: 0,
            revenue: 0
          })
        }
        const stats = sourceStats.get(sourceKey)
        stats.conversions++
        stats.revenue += path.revenue
      })

      pathAnalysis[goal.id] = {
        goalName: goal.name,
        goalType: goal.goalType,
        totalConversions: conversionPaths.length,
        totalRevenue: conversionPaths.reduce((sum, path) => sum + path.revenue, 0),
        avgSessionDuration: conversionPaths.length > 0 
          ? Math.round(conversionPaths.reduce((sum, path) => sum + path.sessionDuration, 0) / conversionPaths.length)
          : 0,
        sourceBreakdown: Array.from(sourceStats.values())
          .sort((a, b) => b.conversions - a.conversions),
        recentConversions: conversionPaths.slice(0, 10).map(path => ({
          conversionDate: path.conversionDate,
          entryKeyword: path.entryKeyword,
          entryPage: path.entryPage,
          pageViews: path.pageViews,
          sessionDuration: path.sessionDuration,
          revenue: path.revenue
        }))
      }
    }

    return NextResponse.json({
      success: true,
      goals: goals.map(g => ({ id: g.id, name: g.name, goalType: g.goalType })),
      pathAnalysis,
      keywordAnalysis,
      pageJourneyAnalysis,
      period,
      message: `${goals.length}개 목표에 대한 전환 경로 분석을 완료했습니다.`
    })

  } catch (error: any) {
    console.error('Conversion paths analysis error:', error)
    return NextResponse.json({
      error: 'Failed to analyze conversion paths',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// 전환 경로 데이터 수집 및 저장
export async function POST(request: NextRequest) {
  try {
    const { propertyId = '464147982', goalIds } = await request.json()

    // GA4에서 전환 데이터 수집
    const conversionData = await fetchConversionDataFromGA4(propertyId, goalIds)
    
    // DB에 저장
    let savedCount = 0
    for (const pathData of conversionData) {
      try {
        await prisma.conversionPath.create({
          data: pathData
        })
        savedCount++
      } catch (error) {
        console.error('Error saving conversion path:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${savedCount}개의 전환 경로 데이터가 저장되었습니다.`,
      recordsSaved: savedCount
    })

  } catch (error: any) {
    console.error('Conversion path collection error:', error)
    return NextResponse.json({
      error: 'Failed to collect conversion path data',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// GA4에서 전환 경로 데이터 수집
async function fetchConversionDataFromGA4(propertyId: string, goalIds?: string[]) {
  const fs = require('fs')
  const path = require('path')
  
  const serviceAccountPath = path.join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json')
  const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
  const serviceAccount = JSON.parse(serviceAccountData)

  const jwt = require('jsonwebtoken')
  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }, serviceAccount.private_key, { algorithm: 'RS256' })

  const authResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
  })

  const tokenData = await authResponse.json()
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token for GA4')
  }

  // User journey 분석을 위한 GA4 데이터 조회
  const gaResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'sessionId' },
          { name: 'date' },
          { name: 'pagePath' },
          { name: 'eventName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' }
        ],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'eventCount' },
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'PARTIAL_REGEXP',
              value: '소개서 다운로드|문의하기'
            }
          }
        },
        limit: 1000
      })
    }
  )

  if (!gaResponse.ok) {
    throw new Error(`GA4 API error: ${gaResponse.status}`)
  }

  const gaData = await gaResponse.json()
  const conversionPaths = []

  // 활성 Goal 목록 조회
  const activeGoals = await prisma.conversionGoal.findMany({
    where: {
      propertyId,
      isActive: true,
      ...(goalIds && { id: { in: goalIds } })
    }
  })

  // GA4 데이터를 전환 경로로 변환
  const sessionGroups = new Map()
  
  for (const row of gaData.rows || []) {
    const sessionId = row.dimensionValues[0].value
    const date = row.dimensionValues[1].value
    const pagePath = row.dimensionValues[2].value
    const eventName = row.dimensionValues[3].value
    const source = row.dimensionValues[4].value
    const medium = row.dimensionValues[5].value
    
    const pageViews = Number(row.metricValues[0].value)
    const eventCount = Number(row.metricValues[1].value)
    const conversions = Number(row.metricValues[2].value)
    const revenue = Number(row.metricValues[3].value)

    if (!sessionGroups.has(sessionId)) {
      sessionGroups.set(sessionId, {
        sessionId,
        date,
        source,
        medium,
        pages: [],
        events: [],
        totalPageViews: 0,
        totalEvents: 0,
        conversions,
        revenue
      })
    }

    const session = sessionGroups.get(sessionId)
    session.pages.push({
      page: pagePath,
      timestamp: date,
      pageViews
    })
    session.events.push({
      event: eventName,
      page: pagePath,
      timestamp: date,
      count: eventCount
    })
    session.totalPageViews += pageViews
    session.totalEvents += eventCount
  }

  // 전환 세션을 전환 경로로 변환
  for (const session of sessionGroups.values()) {
    if (session.conversions > 0) {
      // 매칭되는 Goal 찾기
      const matchingGoal = activeGoals.find(goal => {
        if (goal.goalType === 'EVENT') {
          return session.events.some(event => 
            event.event.includes(goal.eventName || '')
          )
        }
        return false
      })

      if (matchingGoal) {
        conversionPaths.push({
          goalId: matchingGoal.id,
          sessionId: session.sessionId,
          propertyId,
          conversionDate: new Date(session.date),
          entryKeyword: null, // GSC 데이터와 연계 필요
          entrySource: session.source,
          entryMedium: session.medium,
          entryPage: session.pages[0]?.page || '/',
          pageSequence: JSON.stringify(session.pages),
          eventSequence: JSON.stringify(session.events),
          sessionDuration: 0, // 계산 로직 추가 필요
          pageViews: session.totalPageViews,
          totalEvents: session.totalEvents,
          revenue: session.revenue
        })
      }
    }
  }

  return conversionPaths
}