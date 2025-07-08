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
        'config/ga-auto-464002-f4628b785d39.json'
      )
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
    } catch (fileError) {
      console.error('Service account file error:', fileError)
      return NextResponse.json(
        {
          error: 'Service account file not found',
          message: 'ga-auto-464002-f4628b785d39.json 파일을 config 폴더에 배치해주세요.',
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

    // 1. 전체 페이지뷰 메트릭
    const pageViewMetricsResponse = await fetch(
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
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        }),
      }
    )

    let pageViewMetrics = {
      totalPageViews: 0,
      uniquePageViews: 0,
      avgTimeOnPage: 0,
      pageConversionRate: 0,
    }

    if (pageViewMetricsResponse.ok) {
      const metricsData = await pageViewMetricsResponse.json()
      const row = metricsData.rows?.[0]?.metricValues || []

      pageViewMetrics = {
        totalPageViews: Number(row[0]?.value || 0),
        uniquePageViews: Math.round(Number(row[0]?.value || 0) * 0.8), // Estimate unique views
        avgTimeOnPage: Number(row[2]?.value || 0),
        pageConversionRate: Math.random() * 0.05, // Mock conversion rate
      }
    }

    // 2. 페이지별 상세 데이터
    const topPagesResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: period, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 20,
        }),
      }
    )

    let topPages = []
    if (topPagesResponse.ok) {
      const pagesData = await topPagesResponse.json()
      topPages =
        pagesData.rows?.map((row: any) => ({
          path: row.dimensionValues[0].value,
          title: row.dimensionValues[1].value || row.dimensionValues[0].value,
          pageViews: Number(row.metricValues[0].value || 0),
          users: Number(row.metricValues[1].value || 0),
          avgTimeOnPage: Number(row.metricValues[2].value || 0),
          bounceRate: Number(row.metricValues[3].value || 0),
        })) || []
    }

    // 3. 페이지 카테고리별 분석 (path 기반으로 카테고리 분류)
    const pageCategories = []
    if (topPages.length > 0) {
      const categories = {
        Home: { pages: [], color: '#3B82F6' },
        Blog: { pages: [], color: '#10B981' },
        Product: { pages: [], color: '#F59E0B' },
        About: { pages: [], color: '#8B5CF6' },
        Contact: { pages: [], color: '#EF4444' },
        Other: { pages: [], color: '#6B7280' },
      }

      topPages.forEach((page: any) => {
        const path = page.path.toLowerCase()
        if (path === '/' || path.includes('home')) {
          categories.Home.pages.push(page)
        } else if (path.includes('blog') || path.includes('post')) {
          categories.Blog.pages.push(page)
        } else if (path.includes('product') || path.includes('item')) {
          categories.Product.pages.push(page)
        } else if (path.includes('about') || path.includes('company')) {
          categories.About.pages.push(page)
        } else if (path.includes('contact') || path.includes('support')) {
          categories.Contact.pages.push(page)
        } else {
          categories.Other.pages.push(page)
        }
      })

      const totalPageViews = topPages.reduce((sum: number, page: any) => sum + page.pageViews, 0)

      Object.entries(categories).forEach(([name, category]: [string, any]) => {
        if (category.pages.length > 0) {
          const categoryPageViews = category.pages.reduce(
            (sum: number, page: any) => sum + page.pageViews,
            0
          )
          pageCategories.push({
            name,
            pageViews: categoryPageViews,
            percentage: ((categoryPageViews / totalPageViews) * 100).toFixed(1),
            color: category.color,
          })
        }
      })
    }

    // 4. 페이지 성능 지표 (mock data)
    const performanceMetrics = {
      avgLoadTime: (Math.random() * 2 + 1).toFixed(1), // 1-3초
      avgScrollDepth: Math.round(Math.random() * 40 + 50), // 50-90%
      avgEventsPerPage: Math.random() * 3 + 2, // 2-5 이벤트
      mobileViewsRate: Math.random() * 0.4 + 0.5, // 50-90%
    }

    // 5. 페이지 플로우 분석 (mock data)
    const flowAnalysis = {
      landingPages: Math.round(topPages.length * 0.3),
      intermediatePages: Math.round(topPages.length * 0.5),
      exitPages: Math.round(topPages.length * 0.2),
    }

    return NextResponse.json({
      success: true,
      period,
      propertyId,
      ...pageViewMetrics,
      ...performanceMetrics,
      topPages,
      pageCategories,
      flowAnalysis,
    })
  } catch (error: any) {
    console.error('PageViews detail analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load pageviews detail analysis',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
