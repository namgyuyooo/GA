import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]

    // Service Account 기반 실제 데이터 가져오기
    const fs = require('fs')
    const path = require('path')

    let serviceAccount
    try {
      const serviceAccountPath = path.join(
        process.cwd(),
        'secrets/ga-auto-464002-672370fda082.json'
      )
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
    } catch (fileError) {
      console.error('Service account file error:', fileError)
      return NextResponse.json(
        {
          error: 'Service account file not found',
          message: 'ga-auto-464002-672370fda082.json 파일을 secrets 폴더에 배치해주세요.',
        },
        { status: 500 }
      )
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

    // 1. 기본 세션 메트릭
    const basicMetricsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
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
      }
    )

    let basicMetrics = {
      totalSessions: 0,
      avgSessionDuration: 0,
      pagesPerSession: 0,
      bounceRate: 0,
    }
    if (basicMetricsResponse.ok) {
      const basicData = await basicMetricsResponse.json()
      const row = basicData.rows?.[0]?.metricValues || []
      basicMetrics = {
        totalSessions: Number(row[0]?.value || 0),
        avgSessionDuration: Number(row[1]?.value || 0),
        pagesPerSession: Number(row[2]?.value || 0),
        bounceRate: Number(row[3]?.value || 0),
      }
    }

    // 2. 시간대별 세션 분포
    const hourlySessionsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'hour' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ dimension: { dimensionName: 'hour' } }],
        }),
      }
    )

    let sessionsByHour = []
    if (hourlySessionsResponse.ok) {
      const hourlyData = await hourlySessionsResponse.json()
      sessionsByHour =
        hourlyData.rows?.map((row: any) => ({
          hour: Number(row.dimensionValues[0].value),
          sessions: Number(row.metricValues[0].value),
        })) || []
    }

    // 3. 기기별 세션 분포
    const deviceSessionsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        }),
      }
    )

    let sessionsByDevice = []
    if (deviceSessionsResponse.ok) {
      const deviceData = await deviceSessionsResponse.json()
      const totalDeviceSessions =
        deviceData.rows?.reduce(
          (sum: number, row: any) => sum + Number(row.metricValues[0].value),
          0
        ) || 1

      const deviceColors = { mobile: '#3B82F6', desktop: '#10B981', tablet: '#F59E0B' }

      sessionsByDevice =
        deviceData.rows?.map((row: any) => {
          const sessions = Number(row.metricValues[0].value)
          const category = row.dimensionValues[0].value
          return {
            category,
            sessions,
            percentage: ((sessions / totalDeviceSessions) * 100).toFixed(1),
            color: deviceColors[category as keyof typeof deviceColors] || '#6B7280',
          }
        }) || []
    }

    // 4. 지역별 세션 분포
    const countrySessionsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        }),
      }
    )

    let sessionsByCountry = []
    if (countrySessionsResponse.ok) {
      const countryData = await countrySessionsResponse.json()
      const totalCountrySessions =
        countryData.rows?.reduce(
          (sum: number, row: any) => sum + Number(row.metricValues[0].value),
          0
        ) || 1

      sessionsByCountry =
        countryData.rows?.map((row: any) => {
          const sessions = Number(row.metricValues[0].value)
          return {
            country: row.dimensionValues[0].value,
            sessions,
            percentage: ((sessions / totalCountrySessions) * 100).toFixed(1),
          }
        }) || []
    }

    return NextResponse.json({
      success: true,
      period,
      propertyId,
      ...basicMetrics,
      sessionsByHour,
      sessionsByDevice,
      sessionsByCountry,
    })
  } catch (error: any) {
    console.error('Sessions detail analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load sessions detail analysis',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
