import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      return NextResponse.json({ error: 'Service account key not found' }, { status: 500 })
    }

    const credentials = JSON.parse(serviceAccountKey)
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    })

    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()
    const propertyId = process.env.GA4_PROPERTY_ID

    // 코호트 분석을 위한 주별 데이터 수집
    const cohortResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'cohort' },
            { name: 'cohortNthWeek' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
          ],
          metrics: [
            { name: 'cohortActiveUsers' },
            { name: 'cohortTotalUsers' },
            { name: 'userRetentionRate' },
          ],
          dimensionFilter: buildUTMFilter({ utmSource, utmMedium, utmCampaign }),
          orderBys: [
            { dimension: { dimensionName: 'cohort' } },
            { dimension: { dimensionName: 'cohortNthWeek' } },
          ],
        }),
      }
    )

    if (!cohortResponse.ok) {
      // Mock 데이터 반환 (개발/테스트용)
      return NextResponse.json(generateMockCohortData({ utmSource, utmMedium, utmCampaign }))
    }

    const cohortData = await cohortResponse.json()

    // UTM별 사용자 여정 분석
    const userJourneyResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
            { name: 'eventName' },
            { name: 'pagePath' },
          ],
          metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }, { name: 'conversions' }],
          dimensionFilter: buildUTMFilter({ utmSource, utmMedium, utmCampaign }),
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 100,
        }),
      }
    )

    let userJourneyData = null
    if (userJourneyResponse.ok) {
      userJourneyData = await userJourneyResponse.json()
    }

    return NextResponse.json({
      success: true,
      filters: { utmSource, utmMedium, utmCampaign },
      data: {
        cohortAnalysis: cohortData,
        userJourney: userJourneyData,
        analysis: analyzeCohortData(cohortData, userJourneyData),
      },
    })
  } catch (error: any) {
    console.error('Cohort analysis error:', error)

    // 에러 시 Mock 데이터 반환
    const { searchParams } = new URL(request.url)
    return NextResponse.json(
      generateMockCohortData({
        utmSource: searchParams.get('utm_source'),
        utmMedium: searchParams.get('utm_medium'),
        utmCampaign: searchParams.get('utm_campaign'),
      })
    )
  }
}

function buildUTMFilter({ utmSource, utmMedium, utmCampaign }: any) {
  const filters: any[] = []

  if (utmSource) {
    filters.push({
      fieldName: 'sessionSource',
      stringFilter: { matchType: 'EXACT', value: utmSource },
    })
  }

  if (utmMedium) {
    filters.push({
      fieldName: 'sessionMedium',
      stringFilter: { matchType: 'EXACT', value: utmMedium },
    })
  }

  if (utmCampaign) {
    filters.push({
      fieldName: 'sessionCampaignName',
      stringFilter: { matchType: 'EXACT', value: utmCampaign },
    })
  }

  return filters.length > 0
    ? {
        andGroup: { expressions: filters.map((filter) => ({ filter })) },
      }
    : undefined
}

function analyzeCohortData(cohortData: any, userJourneyData: any) {
  // 코호트 분석 인사이트 생성
  const insights = {
    retentionRates: [],
    dropoffPoints: [],
    engagementPatterns: [],
    conversionFunnels: [],
  }

  if (cohortData?.rows) {
    // 주차별 리텐션 분석
    const retentionByWeek = new Map()

    cohortData.rows.forEach((row: any) => {
      const week = row.dimensionValues[1]?.value
      const retentionRate = parseFloat(row.metricValues[2]?.value || '0')

      if (!retentionByWeek.has(week)) {
        retentionByWeek.set(week, [])
      }
      retentionByWeek.get(week).push(retentionRate)
    })

    // 평균 리텐션 계산
    retentionByWeek.forEach((rates, week) => {
      const avgRetention = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length
      insights.retentionRates.push({
        week: parseInt(week),
        retention: avgRetention,
        userCount: rates.length,
      })
    })
  }

  return insights
}

function generateMockCohortData({ utmSource, utmMedium, utmCampaign }: any) {
  // Mock 코호트 데이터 생성
  const mockCohortData = {
    dimensionHeaders: [
      { name: 'cohort' },
      { name: 'cohortNthWeek' },
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
      { name: 'sessionCampaignName' },
    ],
    metricHeaders: [
      { name: 'cohortActiveUsers' },
      { name: 'cohortTotalUsers' },
      { name: 'userRetentionRate' },
    ],
    rows: [],
  }

  // 4주간의 코호트 데이터 생성
  const sources = utmSource ? [utmSource] : ['google', 'facebook', 'newsletter']
  const mediums = utmMedium ? [utmMedium] : ['cpc', 'social', 'email']
  const campaigns = utmCampaign
    ? [utmCampaign]
    : ['summer_sale', 'brand_awareness', 'product_launch']

  sources.forEach((source) => {
    mediums.forEach((medium) => {
      campaigns.forEach((campaign) => {
        for (let week = 0; week < 4; week++) {
          const baseUsers = 1000 - week * 200 // 주차별 감소
          const retentionRate = Math.max(0.1, 1 - week * 0.25) // 주차별 리텐션 감소

          mockCohortData.rows.push({
            dimensionValues: [
              { value: `2024-06-${String(1 + week * 7).padStart(2, '0')}` },
              { value: week.toString() },
              { value: source },
              { value: medium },
              { value: campaign },
            ],
            metricValues: [
              { value: Math.floor(baseUsers * retentionRate).toString() },
              { value: baseUsers.toString() },
              { value: retentionRate.toFixed(3) },
            ],
          })
        }
      })
    })
  })

  const mockUserJourney = {
    rows: [
      {
        dimensionValues: [
          { value: utmSource || 'google' },
          { value: utmMedium || 'cpc' },
          { value: utmCampaign || 'summer_sale' },
          { value: 'page_view' },
          { value: '/landing' },
        ],
        metricValues: [{ value: '2500' }, { value: '1800' }, { value: '45' }],
      },
      {
        dimensionValues: [
          { value: utmSource || 'google' },
          { value: utmMedium || 'cpc' },
          { value: utmCampaign || 'summer_sale' },
          { value: 'scroll' },
          { value: '/landing' },
        ],
        metricValues: [{ value: '1200' }, { value: '950' }, { value: '32' }],
      },
      {
        dimensionValues: [
          { value: utmSource || 'google' },
          { value: utmMedium || 'cpc' },
          { value: utmCampaign || 'summer_sale' },
          { value: 'purchase' },
          { value: '/checkout' },
        ],
        metricValues: [{ value: '89' }, { value: '89' }, { value: '89' }],
      },
    ],
  }

  return {
    success: true,
    isMockData: true,
    filters: { utmSource, utmMedium, utmCampaign },
    data: {
      cohortAnalysis: mockCohortData,
      userJourney: mockUserJourney,
      analysis: {
        retentionRates: [
          { week: 0, retention: 1.0, userCount: 1000 },
          { week: 1, retention: 0.75, userCount: 750 },
          { week: 2, retention: 0.5, userCount: 500 },
          { week: 3, retention: 0.25, userCount: 250 },
        ],
        dropoffPoints: [
          { page: '/landing', dropoffRate: 0.25, users: 250 },
          { page: '/product', dropoffRate: 0.35, users: 175 },
          { page: '/cart', dropoffRate: 0.45, users: 96 },
        ],
        engagementPatterns: [
          { event: 'page_view', frequency: 'high', retention_impact: 0.15 },
          { event: 'scroll', frequency: 'medium', retention_impact: 0.25 },
          { event: 'click', frequency: 'medium', retention_impact: 0.3 },
        ],
        conversionFunnels: [
          { step: 'Landing', users: 1000, conversion_rate: 1.0 },
          { step: 'Product View', users: 750, conversion_rate: 0.75 },
          { step: 'Add to Cart', users: 300, conversion_rate: 0.4 },
          { step: 'Purchase', users: 89, conversion_rate: 0.3 },
        ],
      },
    },
  }
}
