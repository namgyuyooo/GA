import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

const prisma = new PrismaClient()

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
      const serviceAccountPath = path.join(process.cwd(), 'ga-auto-464002-672370fda082.json')
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
    } catch (fileError) {
      console.error('Service account file error:', fileError)
      return NextResponse.json({
        error: 'Service account file not found',
        message: 'ga-auto-464002-672370fda082.json 파일을 프로젝트 루트에 배치해주세요.'
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

    // 등록된 UTM 캠페인 목록 가져오기 (Prisma)
    const registeredUTMs = await prisma.utmCampaign.findMany()

    // GA4 트래픽 소스 데이터 가져오기
    const trafficSourceResponse = await fetch(
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
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'conversions' },
            { name: 'totalRevenue' }
          ],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' }
          ],
          orderBys: [{ desc: true, metric: { metricName: 'sessions' } }],
          limit: 1000
        })
      }
    )

    const trafficData = await trafficSourceResponse.json()

    // 페이지 경로 데이터 가져오기
    const pagePathResponse = await fetch(
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
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ],
          dimensions: [
            { name: 'pagePath' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }],
          limit: 100
        })
      }
    )

    const pageData = await pagePathResponse.json()

    // 키워드 데이터 가져오기 (오가닉 검색)
    const keywordResponse = await fetch(
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
            { name: 'conversions' }
          ],
          dimensions: [
            { name: 'googleAdsKeyword' },
            { name: 'sessionSource' }
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
          limit: 500
        })
      }
    )

    const keywordData = await keywordResponse.json()

    // 데이터 처리 및 분류
    const sources = processTrafficSources(trafficData, registeredUTMs)
    const pages = processPagePaths(pageData)
    const keywords = processKeywords(keywordData)

    return NextResponse.json({
      success: true,
      propertyId,
      period,
      data: {
        sources,
        pages,
        keywords,
        registeredUTMs: registeredUTMs.length
      },
      message: '✅ 트래픽 소스 분석 데이터가 성공적으로 로드되었습니다.'
    })

  } catch (error: any) {
    console.error('Traffic Analysis API error:', error)
    return NextResponse.json({
      error: 'Failed to load traffic analysis data',
      details: error.message
    }, { status: 500 })
  }
}

// 트래픽 소스 데이터 처리
function processTrafficSources(gaData: any, registeredUTMs: any[]) {
  if (!gaData.rows) return []

  const registeredCampaigns = new Set(
    registeredUTMs.map(utm => `${utm.source}_${utm.medium}_${utm.campaign}`)
  )

  return gaData.rows.map((row: any) => {
    const [source, medium, campaign] = row.dimensionValues.map((d: any) => d.value)
    const [sessions, users, pageViews, avgDuration, bounceRate, conversions, revenue] =
      row.metricValues.map((m: any) => parseFloat(m.value) || 0)

    const campaignKey = `${source}_${medium}_${campaign}`
    const isRegisteredUTM = registeredCampaigns.has(campaignKey)

    // 카테고리 분류
    let category = 'utm'
    if (!isRegisteredUTM) {
      if (medium === 'organic') category = 'organic'
      else if (medium === 'direct' || medium === '(none)') category = 'direct'
      else if (medium === 'referral') category = 'referral'
      else if (medium === 'social') category = 'social'
      else if (medium === 'cpc' || medium === 'ppc') category = 'paid'
      else if (source === '(not set)' || medium === '(not set)') category = 'not_set'
    }

    return {
      source,
      medium,
      campaign,
      sessions,
      users,
      pageViews,
      avgSessionDuration: avgDuration,
      bounceRate,
      conversions,
      revenue,
      isRegisteredUTM,
      category,
      topPages: [] // 추후 연결
    }
  })
}

// 페이지 경로 데이터 처리
function processPagePaths(gaData: any) {
  if (!gaData.rows) return []

  const pageStats: any = {}

  gaData.rows.forEach((row: any) => {
    const [pagePath, source, medium] = row.dimensionValues.map((d: any) => d.value)
    const [pageViews, users, avgDuration, bounceRate] =
      row.metricValues.map((m: any) => parseFloat(m.value) || 0)

    if (!pageStats[pagePath]) {
      pageStats[pagePath] = {
        pagePath,
        pageViews: 0,
        users: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        sources: {},
        topSource: ''
      }
    }

    pageStats[pagePath].pageViews += pageViews
    pageStats[pagePath].users += users
    pageStats[pagePath].avgTimeOnPage += avgDuration
    pageStats[pagePath].bounceRate += bounceRate

    const sourceKey = `${source}/${medium}`
    pageStats[pagePath].sources[sourceKey] = (pageStats[pagePath].sources[sourceKey] || 0) + pageViews
  })

  return Object.values(pageStats).map((page: any) => {
    // 최상위 소스 찾기
    const topSource = Object.entries(page.sources)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'unknown'

    return {
      ...page,
      topSource,
      avgTimeOnPage: formatDuration(page.avgTimeOnPage),
      bounceRate: page.bounceRate / Object.keys(page.sources).length
    }
  }).sort((a, b) => b.pageViews - a.pageViews)
}

// 키워드 데이터 처리
function processKeywords(gaData: any) {
  if (!gaData.rows) return []

  return gaData.rows
    .filter((row: any) => {
      const keyword = row.dimensionValues[0]?.value
      return keyword && keyword !== '(not provided)' && keyword !== '(not set)'
    })
    .map((row: any) => {
      const [keyword, source] = row.dimensionValues.map((d: any) => d.value)
      const [sessions, users, conversions] = row.metricValues.map((m: any) => parseFloat(m.value) || 0)

      return {
        keyword,
        source,
        sessions,
        users,
        conversions
      }
    })
    .sort((a, b) => b.sessions - a.sessions)
}

// 시간 포맷팅
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}초`
  } else {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}분 ${remainingSeconds}초`
  }
}