import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '../../../../lib/cacheService'
import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

async function getGoogleAuth() {
  try {
    console.log('🔑 Creating Google Auth...')
    
    const serviceAccountPath = path.join(
      process.cwd(),
      'config/ga-auto-464002-f4628b785d39.json'
    )

    let serviceAccount
    try {
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
      // Ensure private_key has correct newlines if read from file
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
      }
      console.log('📝 Using service account from file:', serviceAccountPath)
    } catch (fileError: any) {
      console.error('❌ Error reading service account file:', fileError.message)
      throw new Error(`Failed to read service account file: ${fileError.message}`)
    }

    console.log('👤 Service account email:', serviceAccount.client_email)
    
    // Create JWT assertion manually
    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    const tokenPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }
    
    const assertion = jwt.sign(tokenPayload, serviceAccount.private_key, {
      algorithm: 'RS256',
      header: { alg: 'RS256', typ: 'JWT' }
    })
    
    // Get access token directly
    console.log('🔐 Getting access token...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown error'}`)
    }
    
    console.log('✅ Google Auth successful')
    
    return {
      credentials: {
        access_token: tokenData.access_token
      }
    }
  } catch (error: any) {
    console.error('❌ Google Auth Error:', error)
    throw new Error(`Failed to authenticate with Google Service Account: ${error.message}`)
  }
}

async function fetchGA4Data(auth: any, propertyId: string, period: string) {
  const accessToken = auth.credentials.access_token

  const [kpiResponse, realtimeResponse, topPagesResponse, campaignResponse] = await Promise.all([
    // KPI 데이터
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      }),
    }),
    // 실시간 데이터
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
    }),
    // 인기 페이지
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    }),
    // UTM 캠페인
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: period, endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [
          { name: 'sessionCampaignName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        limit: 10,
      }),
    }),
  ])

  // Parse JSON responses
  const kpiData = await kpiResponse.json()
  const realtimeData = await realtimeResponse.json()
  const topPagesData = await topPagesResponse.json()
  const campaignData = await campaignResponse.json()

  const kpiRow = kpiData.rows?.[0]?.metricValues || []
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
    activeUsers: Number(realtimeData.rows?.[0]?.metricValues?.[0]?.value || 0),
  }

  const topPages = topPagesData.rows?.map((row: any, index: number) => ({
    id: (index + 1).toString(),
    path: row.dimensionValues[0].value,
    title: row.dimensionValues[1].value || row.dimensionValues[0].value,
    pageViews: Number(row.metricValues[0].value || 0),
    sessions: Number(row.metricValues[1].value || 0),
    users: Number(row.metricValues[2].value || 0),
    avgSessionDuration: Number(row.metricValues[3].value || 0),
    bounceRate: Number(row.metricValues[4].value || 0),
  })) || []

  const campaigns = campaignData.rows?.map((row: any, index: number) => ({
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
    console.log('🚀 Dashboard overview API called')
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    
    console.log('📋 Request params:', { period, propertyId, forceRefresh })

    // 1. forceRefresh가 false일 때 캐시 확인
    if (!forceRefresh) {
      console.log('💾 Checking cache...')
      const cachedData = await CacheService.getCachedAnalyticsData(
        propertyId,
        'overview',
        period
      )
      if (cachedData && cachedData.data) {
        console.log('✅ Cache hit - returning cached data')
        return NextResponse.json({
          success: true,
          fromCache: true,
          dataTimestamp: cachedData.lastUpdated,
          data: cachedData.data,
        })
      }
      console.log('❌ Cache miss - fetching fresh data')
    }

    // 2. 캐시가 없거나 forceRefresh=true 이면, 새 데이터 가져오기
    console.log('🔐 Getting Google Auth...')
    const auth = await getGoogleAuth()
    console.log('📊 Fetching GA4 data...')
    const freshData = await fetchGA4Data(auth, propertyId, period)
    console.log('✅ GA4 data fetched successfully')

    // 3. 가져온 데이터를 DB에 캐싱 (fetchFunction으로 전달)
    await CacheService.getCachedAnalyticsData(propertyId, 'overview', period, async () => freshData)

    return NextResponse.json({
      success: true,
      fromCache: false,
      dataTimestamp: new Date().toISOString(),
      data: freshData,
    })

  } catch (error: any) {
    console.error('Dashboard overview error:', error.message, error.stack)
    return NextResponse.json(
      {
        error: 'Failed to load dashboard overview',
        details: error.message,
      },
      { status: 500 }
    )
  }
}