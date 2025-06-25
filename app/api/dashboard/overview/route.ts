import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]
    const dataMode = searchParams.get('dataMode') || 'realtime'

    // DB 모드인 경우 데이터베이스에서 데이터 로드
    if (dataMode === 'database') {
      // TODO: 데이터베이스에서 저장된 데이터 로드
      // 현재는 실시간 데이터를 반환하되, DB 모드임을 표시
      console.log('DB 모드로 데이터 요청됨')
    }

    // Service Account 기반 실제 데이터 가져오기 (파일에서 직접 읽기)
    const fs = require('fs')
    const path = require('path')
    
    let serviceAccount
    try {
      const serviceAccountPath = path.join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json')
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
    } catch (fileError) {
      console.error('Service account file error:', fileError)
      return NextResponse.json({
        error: 'Service account file not found',
        message: 'ga-auto-464002-672370fda082.json 파일을 secrets 폴더에 배치해주세요.'
      }, { status: 500 })
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
      return NextResponse.json({
        error: 'Failed to get access token',
        details: tokenData
      }, { status: 401 })
    }

    // GA4 Reporting API 호출
    const gaResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
            { name: 'conversions' }
          ],
          dimensions: []
        })
      }
    )

    if (!gaResponse.ok) {
      const errorText = await gaResponse.text()
      return NextResponse.json({
        error: 'GA4 API error',
        details: errorText,
        propertyId
      }, { status: gaResponse.status })
    }

    const gaData = await gaResponse.json()
    const kpiRow = gaData.rows?.[0]?.metricValues || []
    
    const kpis = {
      totalSessions: Number(kpiRow[0]?.value || 0),
      totalUsers: Number(kpiRow[1]?.value || 0),
      pageViews: Number(kpiRow[2]?.value || 0),
      conversions: Number(kpiRow[3]?.value || 0),
      conversionRate: kpiRow[0]?.value && kpiRow[3]?.value ? Number(kpiRow[3].value) / Number(kpiRow[0].value) : 0
    }

    // 실시간 사용자 데이터
    const realtimeResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }]
        })
      }
    )

    let realTimeData = { activeUsers: 0 }
    if (realtimeResponse.ok) {
      const realtimeData = await realtimeResponse.json()
      realTimeData = {
        activeUsers: Number(realtimeData.rows?.[0]?.metricValues?.[0]?.value || 0)
      }
    }

    // 인기 페이지 데이터 (실제 GA4 데이터)
    const topPagesResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' }
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20
        })
      }
    )

    let topPages = []
    if (topPagesResponse.ok) {
      const topPagesData = await topPagesResponse.json()
      topPages = topPagesData.rows?.map((row: any, index: number) => ({
        id: (index + 1).toString(),
        path: row.dimensionValues[0].value,
        title: row.dimensionValues[1].value || row.dimensionValues[0].value,
        pageViews: Number(row.metricValues[0].value || 0),
        sessions: Number(row.metricValues[1].value || 0),
        users: Number(row.metricValues[2].value || 0),
        avgSessionDuration: Number(row.metricValues[3].value || 0),
        bounceRate: Number(row.metricValues[4].value || 0),
        createdAt: new Date().toISOString()
      })) || []
    }

    // UTM 캠페인별 성과 (실제 GA4 데이터)
    const campaignResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ],
          dimensions: [
            { name: 'sessionCampaignName' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          limit: 10
        })
      }
    )

    let campaigns = []
    if (campaignResponse.ok) {
      const campaignData = await campaignResponse.json()
      campaigns = campaignData.rows?.map((row: any, index: number) => ({
        id: String(index + 1),
        name: row.dimensionValues[0]?.value || 'Unknown Campaign',
        source: row.dimensionValues[1]?.value || 'Unknown Source',
        medium: row.dimensionValues[2]?.value || 'Unknown Medium',
        campaign: row.dimensionValues[0]?.value || 'Unknown Campaign',
        sessions: Number(row.metricValues[0]?.value || 0),
        conversions: Number(row.metricValues[1]?.value || 0),
        createdAt: new Date().toISOString()
      })) || []
    }

    return NextResponse.json({
      success: true,
      isMockData: false,
      isDemoMode: false,
      period,
      propertyId,
      dataMode,
      availableProperties: DEFAULT_PROPERTIES,
      message: `✅ ${dataMode === 'realtime' ? '실시간' : 'DB'} GA4 데이터가 성공적으로 로드되었습니다.`,
      data: {
        kpis,
        topCampaigns: campaigns.slice(0, 5),
        topPages: topPages.slice(0, 10),
        realTimeData
      }
    });

  } catch (error: any) {
    console.error('Dashboard overview error:', error)
    return NextResponse.json({
      error: 'Failed to load dashboard overview',
      details: error.message
    }, { status: 500 })
  }
}