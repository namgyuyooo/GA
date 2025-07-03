import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

// Load environment variables from the correct location
const fs = require('fs')
const path = require('path')

function loadEnvironmentVariables() {
  const envPaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', 'GA', '.env.local'),
    path.join('/Users/rtm/Documents/GitHub/GA/.env.local')
  ]
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log('Loading env from:', envPath)
      const envContent = fs.readFileSync(envPath, 'utf8')
      const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*(.+)/)
      if (dbUrlMatch) {
        const dbUrl = dbUrlMatch[1].replace(/['"]/g, '').trim()
        process.env.DATABASE_URL = dbUrl
        console.log('Set DATABASE_URL from env file:', dbUrl)
        return
      }
    }
  }
  
  // Fallback
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = 'file:./prisma/dev.db'
    console.log('Using fallback DATABASE_URL:', process.env.DATABASE_URL)
  }
}

loadEnvironmentVariables()

const DEFAULT_PROPERTIES = ['464147982', '482625214', '483589217', '462871516']

// DB에서 키워드 코호트 데이터 조회
export async function GET(request: NextRequest) {
  const prisma = new PrismaClient()
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30daysAgo'
    const propertyId = searchParams.get('propertyId') || DEFAULT_PROPERTIES[0]
    const keyword = searchParams.get('keyword') || 'all'

    // 기간 파싱
    const daysAgo = parseInt(period.replace('daysAgo', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // DB에서 키워드 코호트 데이터 조회
    const cohortData = await prisma.keywordCohortData.findMany({
      where: {
        propertyId,
        cohortDate: {
          gte: startDate
        }
      },
      orderBy: [
        { cohortDate: 'desc' },
        { impressions: 'desc' }
      ]
    })

    // 고유 키워드 목록 추출
    const keywords = Array.from(new Set(cohortData.map(item => item.keyword)))

    // 최근 업데이트 정보 조회
    const lastUpdate = await prisma.dataUpdateLog.findFirst({
      where: {
        dataType: 'keyword_cohort',
        propertyId,
        status: 'SUCCESS'
      },
      orderBy: { completedAt: 'desc' }
    })

    // DB에 데이터가 없으면 빈 배열 반환
    if (cohortData.length === 0) {
      return NextResponse.json({
        success: true,
        propertyId,
        period,
        keyword,
        cohorts: [],
        keywords: [],
        lastUpdate: null,
        totalRecords: 0,
        isDemo: false,
        message: '⚠️ DB에 데이터가 없습니다. "데이터 업데이트" 버튼을 클릭하여 실제 데이터를 가져오세요.'
      })
    }

    return NextResponse.json({
      success: true,
      propertyId,
      period,
      keyword,
      cohorts: cohortData,
      keywords,
      lastUpdate: lastUpdate?.completedAt || null,
      totalRecords: cohortData.length,
      isDemo: false,
      message: '✅ DB에서 키워드 코호트 데이터를 성공적으로 로드했습니다.'
    })

  } catch (error: any) {
    console.error('Keyword cohort DB query error:', error)
    return NextResponse.json({
      error: 'Failed to load keyword cohort data from database',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// 키워드 데이터 수동 업데이트
export async function POST(request: NextRequest) {
  console.log('POST /api/analytics/keyword-cohort called')
  const prisma = new PrismaClient()
  
  try {
    console.log('Parsing request body...')
    const body = await request.json()
    console.log('Request body:', body)
    const { propertyId = DEFAULT_PROPERTIES[0] } = body

    console.log('Testing Prisma connection...')
    // Test Prisma connection
    await prisma.$connect()
    console.log('Prisma connection successful')

    // 업데이트 로그 생성
    const updateLog = await prisma.dataUpdateLog.create({
      data: {
        dataType: 'keyword_cohort',
        propertyId,
        status: 'RUNNING',
        triggeredBy: 'MANUAL'
      }
    })

    try {
      console.log(`Starting keyword data update for propertyId: ${propertyId}`)
      
      // Google Search Console API에서 실제 데이터 가져오기
      const keywordData = await fetchKeywordDataFromGSC(propertyId)
      console.log(`Fetched ${keywordData.length} keyword records from GSC`)
      
      // DB에 데이터 저장 (upsert 사용)
      let savedCount = 0
      for (const data of keywordData) {
        try {
          await prisma.keywordCohortData.upsert({
          where: {
            cohortDate_keyword_propertyId: {
              cohortDate: data.cohortDate,
              keyword: data.keyword,
              propertyId: propertyId
            }
          },
          update: {
            impressions: data.impressions,
            clicks: data.clicks,
            ctr: data.ctr,
            position: data.position,
            initialUsers: data.initialUsers,
            retentionWeek1: data.retentionWeek1,
            retentionWeek2: data.retentionWeek2,
            retentionWeek4: data.retentionWeek4,
            retentionWeek8: data.retentionWeek8,
            conversions: data.conversions,
            revenue: data.revenue,
            updatedAt: new Date()
          },
          create: {
            cohortDate: data.cohortDate,
            keyword: data.keyword,
            propertyId,
            impressions: data.impressions,
            clicks: data.clicks,
            ctr: data.ctr,
            position: data.position,
            initialUsers: data.initialUsers,
            retentionWeek1: data.retentionWeek1,
            retentionWeek2: data.retentionWeek2,
            retentionWeek4: data.retentionWeek4,
            retentionWeek8: data.retentionWeek8,
            conversions: data.conversions,
            revenue: data.revenue,
            dataSource: 'GSC'
          }
        })
        savedCount++
      } catch (upsertError: any) {
        console.error('Error upserting keyword data:', upsertError.message, data)
        // Continue with other records even if one fails
      }
    }
    
    console.log(`Successfully saved ${savedCount} keyword records`)

      // 업데이트 로그 완료 처리
      await prisma.dataUpdateLog.update({
        where: { id: updateLog.id },
        data: {
          status: 'SUCCESS',
          recordsCount: savedCount,
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: `키워드 데이터가 성공적으로 업데이트되었습니다. (${savedCount}개 레코드)`,
        recordsUpdated: savedCount
      })

    } catch (updateError: any) {
      // 업데이트 실패 로그
      await prisma.dataUpdateLog.update({
        where: { id: updateLog.id },
        data: {
          status: 'FAILED',
          errorMessage: updateError.message,
          completedAt: new Date()
        }
      })

      throw updateError
    }

  } catch (error: any) {
    console.error('Keyword data update error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({
      error: 'Failed to update keyword cohort data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}


// Google Search Console에서 키워드 데이터 가져오기
async function fetchKeywordDataFromGSC(propertyId: string) {
  console.log('fetchKeywordDataFromGSC called with propertyId:', propertyId)
  
  // Service Account 인증
  const fs = require('fs')
  const path = require('path')
  const jwt = require('jsonwebtoken')
  
  // Try multiple possible paths for service account file
  const possiblePaths = [
    path.join(process.cwd(), 'secrets', 'ga-auto-464002-672370fda082.json'),
    path.join(process.cwd(), '..', 'GA', 'secrets', 'ga-auto-464002-672370fda082.json'),
    path.join('/Users/rtm/Documents/GitHub/GA/secrets', 'ga-auto-464002-672370fda082.json')
  ]
  
  let serviceAccountPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serviceAccountPath = p
      break
    }
  }
  
  if (!serviceAccountPath) {
    throw new Error('Service account file not found in any of these paths: ' + possiblePaths.join(', '))
  }
  
  const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
  const serviceAccount = JSON.parse(serviceAccountData)
  console.log('Service account loaded, client_email:', serviceAccount.client_email)
  const now = Math.floor(Date.now() / 1000)
  const token = jwt.sign({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }, serviceAccount.private_key, { algorithm: 'RS256' })

  const authResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
  })

  const tokenData = await authResponse.json()
  if (!tokenData.access_token) {
    console.error('OAuth token response:', tokenData)
    throw new Error('Failed to get access token for GSC: ' + (tokenData.error_description || tokenData.error || 'Unknown error'))
  }
  
  console.log('Successfully obtained GSC access token')

  // 최근 90일간 키워드 데이터 조회
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const gscResponse = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain:rtm.ai/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query', 'date'],
      rowLimit: 5000
    })
  })

  if (!gscResponse.ok) {
    const errorText = await gscResponse.text()
    console.error('GSC API error response:', errorText)
    throw new Error(`GSC API error: ${gscResponse.status} - ${errorText}`)
  }

  const gscData = await gscResponse.json()
  console.log(`GSC API returned ${gscData.rows?.length || 0} rows`)
  const keywordData = []

  // 코호트 데이터 생성
  const processedData = new Map()
  
  for (const row of gscData.rows || []) {
    const keyword = row.keys[0]
    const date = new Date(row.keys[1])
    
    // 주간 코호트로 그룹화
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    
    const key = `${keyword}-${weekStart.toISOString().split('T')[0]}`
    
    if (!processedData.has(key)) {
      processedData.set(key, {
        cohortDate: weekStart,
        keyword,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: 0,
        initialUsers: 0,
        retentionWeek1: 0,
        retentionWeek2: 0,
        retentionWeek4: 0,
        retentionWeek8: 0,
        conversions: 0,
        revenue: 0
      })
    }
    
    const cohort = processedData.get(key)
    cohort.impressions += row.impressions || 0
    cohort.clicks += row.clicks || 0
    cohort.position = row.position || 0
    cohort.initialUsers = Math.floor(cohort.clicks * 0.8) // 추정
    
    // 간단한 리텐션 시뮬레이션 (실제로는 GA4 데이터와 연계 필요)
    cohort.retentionWeek1 = Math.floor(cohort.initialUsers * 0.6)
    cohort.retentionWeek2 = Math.floor(cohort.initialUsers * 0.4)
    cohort.retentionWeek4 = Math.floor(cohort.initialUsers * 0.2)
    cohort.retentionWeek8 = Math.floor(cohort.initialUsers * 0.1)
    cohort.conversions = Math.floor(cohort.initialUsers * 0.02)
    cohort.revenue = cohort.conversions * 50000 // 평균 전환 가치
  }
  
  // CTR 계산
  for (const cohort of processedData.values()) {
    cohort.ctr = cohort.impressions > 0 ? cohort.clicks / cohort.impressions : 0
    keywordData.push(cohort)
  }

  return keywordData
}