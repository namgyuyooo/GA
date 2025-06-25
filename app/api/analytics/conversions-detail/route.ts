import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

const { PrismaClient } = require('@prisma/client')

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

    // 1. 전체 전환 메트릭
    const conversionMetricsResponse = await fetch(
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
            { name: 'conversions' },
            { name: 'sessions' },
            { name: 'totalRevenue' },
            { name: 'purchaseRevenue' }
          ]
        })
      }
    )

    let conversionMetrics = {
      totalConversions: 0,
      conversionRate: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    }

    if (conversionMetricsResponse.ok) {
      const metricsData = await conversionMetricsResponse.json()
      const row = metricsData.rows?.[0]?.metricValues || []
      
      const conversions = Number(row[0]?.value || 0)
      const sessions = Number(row[1]?.value || 0)
      const revenue = Number(row[2]?.value || 0)
      
      conversionMetrics = {
        totalConversions: conversions,
        conversionRate: sessions > 0 ? conversions / sessions : 0,
        totalRevenue: revenue,
        averageOrderValue: conversions > 0 ? revenue / conversions : 0
      }
    }

    // 2. 사용자 정의 Goal 기반 전환 이벤트 분석
    const prismaLocal = new PrismaClient()
    
    // 활성 Goal 목록 조회
    const activeGoals = await prismaLocal.conversionGoal.findMany({
      where: {
        propertyId,
        isActive: true
      },
      orderBy: { priority: 'asc' }
    })

    let conversionEvents = []
    let hasCustomGoals = false

    if (activeGoals.length > 0) {
      hasCustomGoals = true
      
      // Goal별 전환 데이터 조회
      const allEventsResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: period, endDate: 'today' }],
            dimensions: [{ name: 'eventName' }],
            metrics: [
              { name: 'eventCount' },
              { name: 'conversions' },
              { name: 'totalRevenue' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'PARTIAL_REGEXP',
                  value: activeGoals.map(g => g.eventName).filter(Boolean).join('|')
                }
              }
            },
            orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
            limit: 50
          })
        }
      )

      if (allEventsResponse.ok) {
        const eventsData = await allEventsResponse.json()
        
        // conversions > 0인 이벤트만 필터링
        const actualConversionEvents = eventsData.rows?.filter((row: any) => 
          Number(row.metricValues[1].value) > 0
        ) || []
        
        const totalEventConversions = actualConversionEvents.reduce((sum: number, row: any) => 
          sum + Number(row.metricValues[1].value), 0
        ) || 1
        
        const eventColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
        
        conversionEvents = actualConversionEvents.map((row: any, index: number) => {
          const eventName = row.dimensionValues[0].value
          const eventCount = Number(row.metricValues[0].value)
          const conversions = Number(row.metricValues[1].value)
          const revenue = Number(row.metricValues[2].value)
          
          // 매칭되는 Goal 찾기
          const matchingGoal = activeGoals.find(goal => 
            goal.eventName && eventName.includes(goal.eventName)
          )
          
          return {
            eventName,
            goalName: matchingGoal?.name || eventName,
            goalType: matchingGoal?.goalType || 'EVENT',
            description: matchingGoal?.description || getEventDescription(eventName),
            priority: matchingGoal?.priority || 3,
            conversions,
            conversionRate: eventCount > 0 ? conversions / eventCount : 0,
            revenue,
            percentage: ((conversions / totalEventConversions) * 100).toFixed(1),
            color: eventColors[index % eventColors.length]
          }
        }).sort((a, b) => a.priority - b.priority) // 우선순위순 정렬
      }
    }

    // 3. 기본 전환 이벤트 분석 (Goal이 없거나 데이터가 부족한 경우)
    if (conversionEvents.length === 0) {
      const defaultEventsResponse = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [{ startDate: period, endDate: 'today' }],
            dimensions: [{ name: 'eventName' }],
            metrics: [
              { name: 'eventCount' },
              { name: 'conversions' },
              { name: 'totalRevenue' }
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'PARTIAL_REGEXP',
                  value: 'purchase|conversion|goal|form|submit|click|download'
                }
              }
            },
            orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
            limit: 20
          })
        }
      )

      if (defaultEventsResponse.ok) {
        const eventsData = await defaultEventsResponse.json()
        
        const actualConversionEvents = eventsData.rows?.filter((row: any) => 
          Number(row.metricValues[1].value) > 0
        ) || []
        
        const totalEventConversions = actualConversionEvents.reduce((sum: number, row: any) => 
          sum + Number(row.metricValues[1].value), 0
        ) || 1
        
        const eventColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
        
        conversionEvents = actualConversionEvents.map((row: any, index: number) => {
          const eventName = row.dimensionValues[0].value
          const eventCount = Number(row.metricValues[0].value)
          const conversions = Number(row.metricValues[1].value)
          const revenue = Number(row.metricValues[2].value)
          
          return {
            eventName,
            goalName: eventName,
            goalType: 'EVENT',
            description: getEventDescription(eventName),
            priority: index + 1,
            conversions,
            conversionRate: eventCount > 0 ? conversions / eventCount : 0,
            revenue,
            percentage: ((conversions / totalEventConversions) * 100).toFixed(1),
            color: eventColors[index % eventColors.length]
          }
        })
      }
    }

    // 4. 실제 전환 경로 분석 (소스/미디어 기반)
    const conversionPathsResponse = await fetch(
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
            { name: 'source' },
            { name: 'medium' }
          ],
          metrics: [
            { name: 'conversions' },
            { name: 'sessions' },
            { name: 'totalRevenue' }
          ],
          orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
          limit: 20
        })
      }
    )

    let conversionPaths = []
    if (conversionPathsResponse.ok) {
      const pathsData = await conversionPathsResponse.json()
      
      const totalPathConversions = pathsData.rows?.reduce((sum: number, row: any) => 
        sum + Number(row.metricValues[0].value), 0
      ) || 1
      
      conversionPaths = pathsData.rows?.map((row: any) => {
        const source = row.dimensionValues[0].value
        const medium = row.dimensionValues[1].value
        const conversions = Number(row.metricValues[0].value)
        const sessions = Number(row.metricValues[1].value)
        const revenue = Number(row.metricValues[2].value)
        
        return {
          source,
          medium,
          channelName: formatChannelName(source, medium),
          conversions,
          conversionRate: sessions > 0 ? conversions / sessions : 0,
          revenue,
          percentage: ((conversions / totalPathConversions) * 100).toFixed(1),
          description: generatePathDescription(source, medium)
        }
      }).filter(path => path.conversions > 0) || []
    }

    await prismaLocal.$disconnect()

    return NextResponse.json({
      success: true,
      data: {
        ...conversionMetrics,
        conversionEvents,
        conversionPaths,
        hasCustomGoals,
        period,
        propertyId,
        dataTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Conversions detail error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '전환 분석 데이터를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

function getEventDescription(eventName: string): string {
  const descriptions: { [key: string]: string } = {
    '소개서 다운로드 버튼 클릭': '소개서 PDF 다운로드',
    '문의하기 버튼 클릭': '문의 페이지 방문 또는 상담 신청',
    'poc 클릭': 'PoC 데모 요청',
    'form_start': '폼 작성 시작',
    'form_submit': '폼 제출 완료',
    'download': '파일 다운로드',
    'contact': '문의하기',
    'purchase': '구매 완료',
    'sign_up': '회원가입'
  }
  return descriptions[eventName] || `${eventName} 이벤트`
}

function generatePathDescription(source: string, medium: string): string {
  const channelName = formatChannelName(source, medium)
  
  // 채널별로 다른 전환 경로 생성
  if (medium === 'organic') {
    return `${source} 검색 → 홈페이지 → 소개서 다운로드`
  } else if (medium === '(none)' && source === '(direct)') {
    return `직접 방문 → 제품 페이지 → 문의하기`
  } else if (medium === 'referral') {
    return `${source} 추천 → 랜딩 페이지 → 전환`
  } else if (medium === 'social') {
    return `${source} 소셜 → 콘텐츠 → 관심 표시 → 전환`
  } else {
    return `${channelName} → 웹사이트 → 전환`
  }
}

function formatChannelName(source: string, medium: string): string {
  if (source === '(direct)' && medium === '(none)') return '직접 방문'
  if (medium === 'organic') return `${source} 검색`
  if (medium === 'cpc' || medium === 'paid') return `${source} 광고`
  if (medium === 'social') return `${source} 소셜`
  if (medium === 'email') return '이메일'
  if (medium === 'referral') return `${source} 추천`
  return `${source} / ${medium}`
}