import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/cacheService'
import { google } from 'googleapis'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

async function getGoogleAuth() {
  try {
    const serviceAccount = JSON.parse(
      require('fs').readFileSync(
        require('path').join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json'),
        'utf8'
      )
    )
    const jwt = new google.auth.JWT(
      serviceAccount.client_email,
      undefined,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly']
    )
    await jwt.authorize()
    return jwt
  } catch (error) {
    console.error('Google Auth Error:', error)
    throw new Error('Failed to authenticate with Google Service Account.')
  }
}

async function fetchGA4Data(auth: any, propertyId: string, period: string) {
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth })

  const [kpiResponse, realtimeResponse, topPagesResponse, campaignResponse] = await Promise.all([
    // KPI 데이터
    analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: period, endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
        ],
      },
    }),
    // 실시간 데이터
    analyticsData.properties.runRealtimeReport({
      property: `properties/${propertyId}`,
      requestBody: { metrics: [{ name: 'activeUsers' }] },
    }),
    // 인기 페이지
    analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: period, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      },
    }),
    // UTM 캠페인
    analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: period, endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [
          { name: 'sessionCampaignName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        limit: 10,
      },
    }),
  ])

  const kpiRow = kpiResponse.data.rows?.[0]?.metricValues || []
  const kpis = {
    totalSessions: Number(kpiRow[0]?.value || 0),
    totalUsers: Number(kpiRow[1]?.value || 0),
    pageViews: Number(kpiRow[2]?.value || 0),
    conversions: Number(kpiRow[3]?.value || 0),
    conversionRate:
      kpiRow[0]?.value && kpiRow[3]?.value
        ? Number(kpiRow[3].value) / Number(kpiRow[0].value)
        : 0,
  }

  const realTimeData = {
    activeUsers: Number(realtimeResponse.data.rows?.[0]?.metricValues?.[0]?.value || 0),
  }

  const topPages = topPagesResponse.data.rows?.map((row: any, index: number) => ({
    id: (index + 1).toString(),
    path: row.dimensionValues[0].value,
    title: row.dimensionValues[1].value || row.dimensionValues[0].value,
    pageViews: Number(row.metricValues[0].value || 0),
    sessions: Number(row.metricValues[1].value || 0),
    users: Number(row.metricValues[2].value || 0),
    avgSessionDuration: Number(row.metricValues[3].value || 0),
    bounceRate: Number(row.metricValues[4].value || 0),
  })) || []

  const campaigns = campaignResponse.data.rows?.map((row: any, index: number) => ({
    id: String(index + 1),
    name: row.dimensionValues[0]?.value || 'Unknown Campaign',
    source: row.dimensionValues[1]?.value || 'Unknown Source',
    medium: row.dimensionValues[2]?.value || 'Unknown Medium',
    sessions: Number(row.metricValues[0]?.value || 0),
    conversions: Number(row.metricValues[1]?.value || 0),
  })) || []

  return {
    kpis,
    topCampaigns: campaigns.slice(0, 5),
    topPages: topPages.slice(0, 10),
    realTimeData,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    // 1. forceRefresh가 false일 때 캐시 확인
    if (!forceRefresh) {
      const cachedData = await CacheService.getCachedAnalyticsData(
        propertyId,
        'overview',
        period
      )
      if (cachedData && cachedData.data) {
        return NextResponse.json({
          success: true,
          fromCache: true,
          dataTimestamp: cachedData.lastUpdated,
          data: cachedData.data,
        })
      }
    }

    // 2. 캐시가 없거나 forceRefresh=true 이면, 새 데이터 가져오기
    const auth = await getGoogleAuth()
    const freshData = await fetchGA4Data(auth, propertyId, period)

    // 3. 가져온 데이터를 DB에 캐싱 (fetchFunction으로 전달)
    await CacheService.getCachedAnalyticsData(propertyId, 'overview', period, async () => freshData)

    return NextResponse.json({
      success: true,
      fromCache: false,
      dataTimestamp: new Date().toISOString(),
      data: freshData,
    })

  } catch (error: any) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load dashboard overview',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
