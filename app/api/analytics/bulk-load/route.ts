import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { propertyId, dateRange } = await request.json()
    
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

    // 여러 데이터 소스에서 일괄 로드
    const dataPromises = [
      // 트래픽 데이터
      fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: dateRange?.startDate || '30daysAgo', endDate: dateRange?.endDate || 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'activeUsers' },
              { name: 'screenPageViews' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' }
            ],
            dimensions: [
              { name: 'date' },
              { name: 'sessionSource' },
              { name: 'sessionMedium' },
              { name: 'sessionCampaignName' }
            ],
            orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
            limit: 1000
          })
        }
      ),

      // 페이지 데이터
      fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: dateRange?.startDate || '30daysAgo', endDate: dateRange?.endDate || 'today' }],
            metrics: [
              { name: 'screenPageViews' },
              { name: 'activeUsers' },
              { name: 'averageSessionDuration' },
              { name: 'bounceRate' }
            ],
            dimensions: [
              { name: 'pagePath' },
              { name: 'pageTitle' }
            ],
            orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }],
            limit: 50
          })
        }
      ),

      // 검색어 데이터
      fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: dateRange?.startDate || '30daysAgo', endDate: dateRange?.endDate || 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'activeUsers' },
              { name: 'screenPageViews' }
            ],
            dimensions: [
              { name: 'googleAdsKeyword' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'sessionMedium',
                stringFilter: {
                  value: 'organic',
                  matchType: 'EXACT'
                }
              }
            },
            orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
            limit: 100
          })
        }
      )
    ]

    const [trafficResponse, pageResponse, searchResponse] = await Promise.all(dataPromises)
    
    const trafficData = await trafficResponse.json()
    const pageData = await pageResponse.json()
    const searchData = await searchResponse.json()

    // 데이터베이스에 저장 (실제 구현에서는 Prisma 등을 사용)
    const bulkData = {
      propertyId,
      dateRange: dateRange || { startDate: '30daysAgo', endDate: 'today' },
      timestamp: new Date().toISOString(),
      traffic: trafficData,
      pages: pageData,
      searchTerms: searchData
    }

    // TODO: 실제 데이터베이스 저장 로직 구현
    console.log('Bulk data loaded:', bulkData)

    return NextResponse.json({
      success: true,
      message: '일괄 데이터 로드가 완료되었습니다.',
      data: {
        trafficRows: trafficData.rows?.length || 0,
        pageRows: pageData.rows?.length || 0,
        searchRows: searchData.rows?.length || 0
      }
    })

  } catch (error) {
    console.error('Bulk data load error:', error)
    
    // 더 자세한 오류 정보 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: '일괄 데이터 로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 