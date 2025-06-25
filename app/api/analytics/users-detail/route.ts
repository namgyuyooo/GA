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
    const tokenPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    }

    const token = jwt.sign(tokenPayload, serviceAccount.private_key, { algorithm: 'RS256' })

    const authResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    })

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`)
    }

    const tokenData = await authResponse.json()

    // 1. 기본 사용자 메트릭
    const userMetricsResponse = await fetch(
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
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'averageSessionDuration' },
            { name: 'engagedSessions' },
            { name: 'sessions' },
            { name: 'bounceRate' }
          ]
        })
      }
    )

    let userMetrics = { 
      totalUsers: 0, 
      newUsers: 0, 
      returningUsers: 0,
      newUserRate: 0,
      avgEngagementTime: 0,
      engagedSessionsRate: 0,
      eventsPerSession: 0,
      returnVisitorRate: 0
    }

    if (userMetricsResponse.ok) {
      const userData = await userMetricsResponse.json()
      const row = userData.rows?.[0]?.metricValues || []
      const totalUsers = Number(row[0]?.value || 0)
      const newUsers = Number(row[1]?.value || 0)
      const avgSessionDuration = Number(row[2]?.value || 0)
      const engagedSessions = Number(row[3]?.value || 0)
      const sessions = Number(row[4]?.value || 0)
      const bounceRate = Number(row[5]?.value || 0)

      userMetrics = {
        totalUsers,
        newUsers,
        returningUsers: Math.max(0, totalUsers - newUsers),
        newUserRate: totalUsers > 0 ? newUsers / totalUsers : 0,
        avgEngagementTime: avgSessionDuration,
        engagedSessionsRate: sessions > 0 ? engagedSessions / sessions : 0,
        eventsPerSession: Math.random() * 5 + 3, // Mock data for now
        returnVisitorRate: totalUsers > 0 ? Math.max(0, totalUsers - newUsers) / totalUsers : 0
      }
    }

    // 2. 사용자 획득 채널
    const acquisitionResponse = await fetch(
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
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          metrics: [{ name: 'newUsers' }],
          orderBys: [{ metric: { metricName: 'newUsers' }, desc: true }],
          limit: 10
        })
      }
    )

    let acquisitionChannels = []
    if (acquisitionResponse.ok) {
      const acquisitionData = await acquisitionResponse.json()
      const totalAcquisitionUsers = acquisitionData.rows?.reduce((sum: number, row: any) => sum + Number(row.metricValues[0].value), 0) || 1
      
      const channelColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ]
      
      acquisitionChannels = acquisitionData.rows?.map((row: any, index: number) => {
        const users = Number(row.metricValues[0].value)
        const source = row.dimensionValues[0].value
        const medium = row.dimensionValues[1].value
        
        return {
          source: source === '(direct)' ? '직접 방문' : source,
          medium: medium === '(none)' ? '직접' : medium,
          users,
          percentage: ((users / totalAcquisitionUsers) * 100).toFixed(1),
          color: channelColors[index % channelColors.length]
        }
      }) || []
    }

    // 3. 신규 vs 재방문 사용자 추이 (일별)
    const userTypesTrendResponse = await fetch(
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
            { name: 'date' },
            { name: 'newVsReturning' }
          ],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }]
        })
      }
    )

    let userTypesTrend = []
    if (userTypesTrendResponse.ok) {
      const trendData = await userTypesTrendResponse.json()
      
      // 날짜별로 그룹화
      const groupedByDate = (trendData.rows || []).reduce((acc: any, row: any) => {
        const date = row.dimensionValues[0].value
        const userType = row.dimensionValues[1].value
        const users = Number(row.metricValues[0].value)
        
        if (!acc[date]) {
          acc[date] = { date, newUsers: 0, returningUsers: 0 }
        }
        
        if (userType === 'new') {
          acc[date].newUsers = users
        } else if (userType === 'returning') {
          acc[date].returningUsers = users
        }
        
        return acc
      }, {})
      
      userTypesTrend = Object.values(groupedByDate).slice(-7) // 최근 7일
    }

    // 4. 사용자 세분화 (mock data for now)
    const segmentation = {
      newVisitors: userMetrics.newUsers,
      activeUsers: Math.round(userMetrics.totalUsers * 0.7),
      highValueUsers: Math.round(userMetrics.totalUsers * 0.15)
    }

    return NextResponse.json({
      success: true,
      period,
      propertyId,
      ...userMetrics,
      acquisitionChannels,
      userTypesTrend,
      segmentation
    })

  } catch (error: any) {
    console.error('Users detail analysis error:', error)
    return NextResponse.json({
      error: 'Failed to load users detail analysis',
      details: error.message
    }, { status: 500 })
  }
}