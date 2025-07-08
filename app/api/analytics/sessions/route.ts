import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]

    // Service Account based authentication
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
      return NextResponse.json(
        {
          error: 'Service account file not found',
          message: `Service account file not found at ${serviceAccountPath}. Please ensure it exists and is accessible.`,
        },
        { status: 500 }
      )
    }

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

    console.log('🔐 Getting access token...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: 'Failed to get access token',
          details: tokenData,
        },
        { status: 401 }
      )
    }
    
    console.log('✅ Google Auth successful')

    // 세션 관련 데이터 수집
    const [sessionsResponse, deviceResponse, countryResponse, hourlyResponse] = await Promise.all([
      // 기본 세션 지표
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          metrics: [
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'screenPageViewsPerSession' },
            { name: 'bounceRate' },
          ],
        }),
      }),
      
      // 기기별 세션
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
        }),
      }),
      
      // 국가별 세션
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
          limit: 10,
        }),
      }),
      
      // 시간대별 세션
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'hour' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ desc: false, dimension: { dimensionName: 'hour' } }],
        }),
      }),
    ])

    if (!sessionsResponse.ok || !deviceResponse.ok || !countryResponse.ok || !hourlyResponse.ok) {
      const errorText = await sessionsResponse.text()
      return NextResponse.json(
        {
          error: 'GA4 sessions API error',
          details: errorText,
          propertyId,
        },
        { status: sessionsResponse.status }
      )
    }

    const [sessionsData, deviceData, countryData, hourlyData] = await Promise.all([
      sessionsResponse.json(),
      deviceResponse.json(),
      countryResponse.json(),
      hourlyResponse.json(),
    ])

    // 기본 세션 지표 처리
    const sessionRow = sessionsData.rows?.[0]?.metricValues || []
    const totalSessions = Number(sessionRow[0]?.value || 0)
    const avgSessionDuration = Number(sessionRow[1]?.value || 0)
    const pagesPerSession = Number(sessionRow[2]?.value || 0)
    const bounceRate = Number(sessionRow[3]?.value || 0)

    // 기기별 세션 처리
    const deviceColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    const sessionsByDevice = deviceData.rows?.map((row: any, index: number) => ({
      category: row.dimensionValues[0]?.value || 'Unknown',
      sessions: Number(row.metricValues[0]?.value || 0),
      percentage: totalSessions > 0 ? ((Number(row.metricValues[0]?.value || 0) / totalSessions) * 100).toFixed(1) : '0.0',
      color: deviceColors[index % deviceColors.length],
    })) || []

    // 국가별 세션 처리
    const sessionsByCountry = countryData.rows?.map((row: any) => ({
      country: row.dimensionValues[0]?.value || 'Unknown',
      sessions: Number(row.metricValues[0]?.value || 0),
      percentage: totalSessions > 0 ? ((Number(row.metricValues[0]?.value || 0) / totalSessions) * 100).toFixed(1) : '0.0',
    })) || []

    // 시간대별 세션 처리 (24시간 전체)
    const hourlyMap = new Map()
    hourlyData.rows?.forEach((row: any) => {
      const hour = Number(row.dimensionValues[0]?.value || 0)
      const sessions = Number(row.metricValues[0]?.value || 0)
      hourlyMap.set(hour, sessions)
    })

    const sessionsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, '0'),
      sessions: hourlyMap.get(hour) || 0,
    }))

    const resultData = {
      totalSessions,
      avgSessionDuration,
      pagesPerSession,
      bounceRate,
      sessionsByDevice,
      sessionsByCountry,
      sessionsByHour,
    }

    return NextResponse.json({
      success: true,
      propertyId,
      period,
      data: resultData,
      message: '✅ 세션 데이터가 성공적으로 로드되었습니다.',
    })
  } catch (error: any) {
    console.error('Sessions API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load sessions data',
        details: error.message,
      },
      { status: 500 }
    )
  }
}