import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/cacheService'
import { PrismaClient } from '@prisma/client'

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
    const propertyId = searchParams.get('propertyId')
    const dataType = searchParams.get('dataType') // 'users', 'sessions', 'pageviews', 'conversions', 'traffic'
    const period = searchParams.get('period') || '30daysAgo'
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    if (!propertyId || !dataType) {
      return NextResponse.json(
        { success: false, error: 'propertyId와 dataType이 필요합니다.' },
        { status: 400 }
      )
    }

    let cachedData

    // 강제 새로고침이 아닌 경우 캐시에서 먼저 조회
    if (!forceRefresh) {
      cachedData = await CacheService.getCachedAnalyticsData(propertyId, dataType, period)

      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          fromCache: cachedData.fromCache,
          lastUpdated: cachedData.lastUpdated,
          stale: cachedData.stale || false,
          message: cachedData.fromCache
            ? '캐시된 데이터를 반환했습니다. (빠른 로딩)'
            : '새로운 데이터를 가져와 캐시했습니다.',
        })
      }
    }

    // 캐시에 없거나 강제 새로고침인 경우 외부 API 호출
    const fetchFunction = async () => {
      return await fetchAnalyticsData(propertyId, dataType, period)
    }

    cachedData = await CacheService.getCachedAnalyticsData(
      propertyId,
      dataType,
      period,
      fetchFunction
    )

    return NextResponse.json({
      success: true,
      data: cachedData.data,
      fromCache: cachedData.fromCache,
      lastUpdated: cachedData.lastUpdated,
      message: '데이터가 성공적으로 로드되었습니다.',
    })
  } catch (error: any) {
    console.error('Cached analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '캐시된 데이터 조회 실패',
        fromCache: false,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 주간 변화율 데이터 제공 API
export async function POST(request: NextRequest) {
  try {
    const { propertyId, dataTypes } = await request.json()

    if (!propertyId || !Array.isArray(dataTypes)) {
      return NextResponse.json(
        { success: false, error: 'propertyId와 dataTypes 배열이 필요합니다.' },
        { status: 400 }
      )
    }

    const weeklyTrends: any = {}

    // 각 데이터 타입별로 주간 변화율 계산
    for (const dataType of dataTypes) {
      try {
        const trendData = await CacheService.calculateWeeklyTrends(propertyId, dataType)
        weeklyTrends[dataType] = trendData
      } catch (error) {
        console.error(`Failed to calculate trends for ${dataType}:`, error)
        weeklyTrends[dataType] = null
      }
    }

    return NextResponse.json({
      success: true,
      weeklyTrends,
      calculatedAt: new Date().toISOString(),
      message: '주간 변화율 데이터가 계산되었습니다.',
    })
  } catch (error: any) {
    console.error('Weekly trends calculation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || '주간 변화율 계산 실패' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 외부 GA4 API 호출 함수 (기존 API 로직 재사용)
async function fetchAnalyticsData(propertyId: string, dataType: string, period: string) {
  // Service Account 기반 실제 데이터 가져오기
  const fs = require('fs')
  const path = require('path')

  let serviceAccount
  try {
    const serviceAccountPath = path.join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json')
    const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
    serviceAccount = JSON.parse(serviceAccountData)
  } catch (fileError) {
    throw new Error('Service account file not found')
  }

  // JWT 토큰으로 Google API 인증
  const jwt = require('jsonwebtoken')

  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign(
    {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    serviceAccount.private_key,
    { algorithm: 'RS256' }
  )

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  })

  const tokenData = await tokenResponse.json()

  if (!tokenData.access_token) {
    throw new Error('Failed to get access token')
  }

  // 데이터 타입별 메트릭과 차원 정의
  const dataTypeConfig = getDataTypeConfig(dataType)

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: period, endDate: 'today' }],
        metrics: dataTypeConfig.metrics,
        dimensions: dataTypeConfig.dimensions,
        orderBys: dataTypeConfig.orderBys || [
          { desc: true, metric: { metricName: dataTypeConfig.metrics[0].name } },
        ],
        limit: 1000,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`GA4 API error: ${response.status}`)
  }

  return await response.json()
}

// 데이터 타입별 설정
function getDataTypeConfig(dataType: string) {
  const configs: Record<string, any> = {
    users: {
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'userEngagementDuration' },
        { name: 'engagedSessions' },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'userType' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
    },
    sessions: {
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
        { name: 'bounceRate' },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'deviceCategory' },
      ],
    },
    pageviews: {
      metrics: [
        { name: 'screenPageViews' },
        { name: 'uniquePageViews' },
        { name: 'averageTimeOnPage' },
        { name: 'exitRate' },
      ],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'pageTitle' }],
    },
    conversions: {
      metrics: [
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'eventCount' },
        { name: 'sessionConversionRate' },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'eventName' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
    },
    traffic: {
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      dimensions: [
        { name: 'date' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
      ],
    },
  }

  return configs[dataType] || configs.users
}
