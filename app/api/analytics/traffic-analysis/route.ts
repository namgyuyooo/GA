import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]

    // Service Account based authentication
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        {
          error: 'Google Service Account credentials not set',
          message: 'GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables must be set.',
        },
        { status: 500 }
      )
    }

    const jwt = new google.auth.JWT(
      clientEmail,
      undefined,
      privateKey.replace(/\n/g, '\n'), // Ensure newlines are correct
      ['https://www.googleapis.com/auth/analytics.readonly']
    )

    await jwt.authorize()

    // 등록된 UTM 캠페인 목록 가져오기 (Prisma)
    const registeredUTMs = await prisma.utmCampaign.findMany()

    // GA4 트래픽 소스 데이터 가져오기
    const trafficSourceResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt.credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'conversions' },
          ],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
          ],
          orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
          limit: 1000,
        }),
      }
    )

    const trafficData = await trafficSourceResponse.json()

    // 페이지 경로 데이터 가져오기
    const pagePathResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt.credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
          dimensions: [{ name: 'pagePath' }, { name: 'sessionSource' }, { name: 'sessionMedium' }],
          orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }],
          limit: 100,
        }),
      }
    )

    const pageData = await pagePathResponse.json()

    // 키워드 데이터 가져오기 (오가닉 검색)
    const keywordResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt.credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'conversions' }],
          dimensions: [{ name: 'googleAdsKeyword' }, { name: 'sessionSource' }],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionMedium',
              stringFilter: {
                value: 'organic',
                matchType: 'EXACT',
              },
            },
          },
          orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
          limit: 500,
        }),
      }
    )

    const keywordData = await keywordResponse.json()

    // 데이터 처리 및 분류
    const sources = processTrafficSources(trafficData, registeredUTMs)
    const pages = processPagePaths(pageData)
    const keywords = processKeywords(keywordData)

    // UnifiedEventSequence에 트래픽 데이터 저장
    try {
      await saveToUnifiedEventSequence(sources, pages, keywords, propertyId)
      console.log('✅ UnifiedEventSequence에 트래픽 데이터 저장 완료')
    } catch (saveError) {
      console.error('UnifiedEventSequence 저장 오류:', saveError)
    }

    // 디버깅 정보 추가
    console.log('🔍 트래픽 소스 분석 디버깅:')
    console.log(`- 등록된 UTM 캠페인: ${registeredUTMs.length}개`)
    console.log(`- GA4 트래픽 소스: ${trafficData.rows?.length || 0}개`)
    console.log(`- 매칭된 UTM: ${sources.filter((s) => s.isRegisteredUTM).length}개`)

    // UTM 매칭 상세 정보
    const utmMatches = sources.filter((s) => s.isRegisteredUTM)
    if (utmMatches.length > 0) {
      console.log('✅ 매칭된 UTM 캠페인:')
      utmMatches.forEach((match) => {
        console.log(`  - ${match.source}/${match.medium}/${match.campaign}: ${match.sessions} 세션`)
      })
    } else {
      console.log('⚠️ 매칭된 UTM 캠페인이 없습니다.')
      console.log('등록된 UTM 캠페인:')
      registeredUTMs.forEach((utm) => {
        console.log(`  - ${utm.source}/${utm.medium}/${utm.campaign}`)
      })
    }

    return NextResponse.json({
      success: true,
      propertyId,
      period,
      data: {
        sources,
        pages,
        keywords,
        registeredUTMs: registeredUTMs.length,
        debug: {
          totalSources: trafficData.rows?.length || 0,
          matchedUTMs: utmMatches.length,
          registeredUTMList: registeredUTMs.map(
            (utm) => `${utm.source}/${utm.medium}/${utm.campaign}`
          ),
        },
      },
      message: '✅ 트래픽 소스 분석 데이터가 성공적으로 로드되었습니다.',
    })
  } catch (error: any) {
    console.error('Traffic Analysis API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load traffic analysis data',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// 트래픽 소스 데이터 처리
function processTrafficSources(gaData: any, registeredUTMs: any[]) {
  if (!gaData.rows) return []

  const registeredCampaigns = new Set(
    registeredUTMs.map((utm) => `${utm.source}_${utm.medium}_${utm.campaign}`)
  )

  // 추가 매칭을 위한 맵 생성
  const utmMap = new Map()
  registeredUTMs.forEach((utm) => {
    // 정확한 매칭
    utmMap.set(`${utm.source}_${utm.medium}_${utm.campaign}`, utm)
    // 부분 매칭 (캠페인만)
    utmMap.set(utm.campaign, utm)
    // 소스+미디엄 매칭
    utmMap.set(`${utm.source}_${utm.medium}`, utm)
  })

  return gaData.rows.map((row: any) => {
    const [source, medium, campaign] = row.dimensionValues.map((d: any) => d.value)
    const [sessions, users, pageViews, avgDuration, bounceRate, conversions, revenue] =
      row.metricValues.map((m: any) => parseFloat(m.value) || 0)

    // 다양한 매칭 시도
    let isRegisteredUTM = false
    let matchedUTM = null

    // 1. 정확한 매칭
    const exactKey = `${source}_${medium}_${campaign}`
    if (utmMap.has(exactKey)) {
      isRegisteredUTM = true
      matchedUTM = utmMap.get(exactKey)
    }
    // 2. 캠페인만 매칭
    else if (campaign && utmMap.has(campaign)) {
      isRegisteredUTM = true
      matchedUTM = utmMap.get(campaign)
    }
    // 3. 소스+미디엄 매칭
    else if (source && medium) {
      const sourceMediumKey = `${source}_${medium}`
      if (utmMap.has(sourceMediumKey)) {
        isRegisteredUTM = true
        matchedUTM = utmMap.get(sourceMediumKey)
      }
    }

    // 카테고리 분류
    let category = 'utm'
    if (!isRegisteredUTM) {
      if (medium === 'organic') category = 'organic'
      else if (medium === 'direct' || medium === '(none)') category = 'direct'
      else if (medium === 'referral') category = 'referral'
      else if (medium === 'social') category = 'social'
      else if (medium === 'cpc' || medium === 'ppc') category = 'paid'
      else if (source === '(not set)' || medium === '(not set)') category = 'not_set'
      else category = 'other'
    }

    return {
      source,
      medium,
      campaign,
      sessions,
      users,
      pageViews,
      avgSessionDuration: avgDuration,
      bounceRate,
      conversions,
      revenue,
      isRegisteredUTM,
      category,
      matchedUTM: matchedUTM
        ? {
            name: matchedUTM.name,
            url: matchedUTM.url,
            description: matchedUTM.description,
          }
        : null,
      topPages: [], // 추후 연결
    }
  })
}

// 페이지 경로 데이터 처리
function processPagePaths(gaData: any) {
  if (!gaData.rows) return []

  const pageStats: any = {}

  gaData.rows.forEach((row: any) => {
    const [pagePath, source, medium] = row.dimensionValues.map((d: any) => d.value)
    const [pageViews, users, avgDuration, bounceRate] = row.metricValues.map(
      (m: any) => parseFloat(m.value) || 0
    )

    if (!pageStats[pagePath]) {
      pageStats[pagePath] = {
        pagePath,
        pageViews: 0,
        users: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        sources: {},
        topSource: '',
      }
    }

    pageStats[pagePath].pageViews += pageViews
    pageStats[pagePath].users += users
    pageStats[pagePath].avgTimeOnPage += avgDuration
    pageStats[pagePath].bounceRate += bounceRate

    const sourceKey = `${source}/${medium}`
    pageStats[pagePath].sources[sourceKey] =
      (pageStats[pagePath].sources[sourceKey] || 0) + pageViews
  })

  return Object.values(pageStats)
    .map((page: any) => {
      // 최상위 소스 찾기
      const topSource =
        Object.entries(page.sources).sort(
          ([, a], [, b]) => (b as number) - (a as number)
        )[0]?.[0] || 'unknown'

      return {
        ...page,
        topSource,
        avgTimeOnPage: formatDuration(page.avgTimeOnPage),
        bounceRate: page.bounceRate / Object.keys(page.sources).length,
      }
    })
    .sort((a, b) => b.pageViews - a.pageViews)
}

// 키워드 데이터 처리
function processKeywords(gaData: any) {
  if (!gaData.rows) return []

  return gaData.rows
    .filter((row: any) => {
      const keyword = row.dimensionValues[0]?.value
      return keyword && keyword !== '(not provided)' && keyword !== '(not set)'
    })
    .map((row: any) => {
      const [keyword, source] = row.dimensionValues.map((d: any) => d.value)
      const [sessions, users, conversions] = row.metricValues.map(
        (m: any) => parseFloat(m.value) || 0
      )

      return {
        keyword,
        source,
        sessions,
        users,
        conversions,
      }
    })
    .sort((a, b) => b.sessions - a.sessions)
}

// UnifiedEventSequence에 트래픽 데이터 저장
async function saveToUnifiedEventSequence(sources: any[], pages: any[], keywords: any[], propertyId: string) {
  const events = []
  const now = new Date()

  // 트래픽 소스 이벤트 생성
  sources.forEach((source, index) => {
    events.push({
      sessionId: `traffic_${propertyId}_${Date.now()}_${index}`,
      propertyId,
      timestamp: now,
      eventType: 'traffic_source',
      eventData: {
        source: source.source,
        medium: source.medium,
        campaign: source.campaign,
        sessions: source.sessions,
        users: source.users,
        pageViews: source.pageViews,
        avgSessionDuration: source.avgSessionDuration,
        bounceRate: source.bounceRate,
        conversions: source.conversions,
        revenue: source.revenue,
        isRegisteredUTM: source.isRegisteredUTM,
        category: source.category,
        matchedUTM: source.matchedUTM,
      },
    })
  })

  // 페이지 경로 이벤트 생성
  pages.forEach((page, index) => {
    events.push({
      sessionId: `page_${propertyId}_${Date.now()}_${index}`,
      propertyId,
      timestamp: now,
      eventType: 'page_view',
      eventData: {
        pagePath: page.pagePath,
        pageViews: page.pageViews,
        users: page.users,
        avgTimeOnPage: page.avgTimeOnPage,
        bounceRate: page.bounceRate,
        topSource: page.topSource,
        sources: page.sources,
      },
    })
  })

  // 키워드 이벤트 생성
  keywords.forEach((keyword, index) => {
    events.push({
      sessionId: `keyword_${propertyId}_${Date.now()}_${index}`,
      propertyId,
      timestamp: now,
      eventType: 'search_inflow',
      eventData: {
        keyword: keyword.keyword,
        source: keyword.source,
        sessions: keyword.sessions,
        users: keyword.users,
        conversions: keyword.conversions,
      },
    })
  })

  // 배치로 저장
  if (events.length > 0) {
    await prisma.unifiedEventSequence.createMany({
      data: events,
      skipDuplicates: true,
    })
  }
}

// 시간 포맷팅
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}초`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}분 ${remainingSeconds}초`
  }
}