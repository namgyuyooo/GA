import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  service: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  timestamp: string
}

export async function POST(request: NextRequest) {
  const testResults: TestResult[] = []
  const timestamp = new Date().toISOString()

  try {
    console.log('🧪 Starting environment configuration tests...')
    
    // 1. Database Connection Test
    await testDatabaseConnection(testResults, timestamp)
    
    // 2. Google Service Account Test
    await testGoogleServiceAccount(testResults, timestamp)
    
    // 3. Gemini API Test
    await testGeminiAPI(testResults, timestamp)
    
    // 4. Environment Variables Test
    await testEnvironmentVariables(testResults, timestamp)
    
    console.log('✅ Environment configuration tests completed')
    
    return NextResponse.json({
      success: true,
      timestamp,
      results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'success').length,
        failed: testResults.filter(r => r.status === 'error').length,
        warnings: testResults.filter(r => r.status === 'warning').length
      }
    })
  } catch (error: any) {
    console.error('❌ Environment test error:', error)
    
    testResults.push({
      service: 'Test Runner',
      status: 'error',
      message: `테스트 실행 중 오류 발생: ${error.message}`,
      timestamp
    })
    
    return NextResponse.json({
      success: false,
      timestamp,
      results: testResults,
      error: error.message
    }, { status: 500 })
  }
}

async function testDatabaseConnection(results: TestResult[], timestamp: string) {
  try {
    console.log('🔍 Testing database connection...')
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1`
    
    // Test specific tables
    const tableTests = [
      { name: 'UTMCampaign', query: () => prisma.utmCampaign.count() },
      { name: 'UnifiedEventSequence', query: () => prisma.unifiedEventSequence.count() },
      { name: 'KeywordCohortGroup', query: () => prisma.keywordCohortGroup.count() }
    ]
    
    for (const test of tableTests) {
      try {
        const count = await test.query()
        console.log(`✅ Table ${test.name}: ${count} records`)
        
        results.push({
          service: `Database - ${test.name}`,
          status: 'success',
          message: `테이블 접근 성공 (${count}개 레코드)`,
          details: { recordCount: count },
          timestamp
        })
      } catch (tableError: any) {
        console.error(`❌ Table ${test.name} error:`, tableError.message)
        
        results.push({
          service: `Database - ${test.name}`,
          status: 'error',
          message: `테이블 접근 실패: ${tableError.message}`,
          details: { error: tableError.message },
          timestamp
        })
      }
    }
    
    await prisma.$disconnect()
    
    results.push({
      service: 'Database Connection',
      status: 'success',
      message: `데이터베이스 연결 성공 (${process.env.DATABASE_URL?.split('@')[1] || 'localhost'})`,
      details: { 
        url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@') || 'Not set',
        driver: 'PostgreSQL'
      },
      timestamp
    })
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    
    results.push({
      service: 'Database Connection',
      status: 'error',
      message: `데이터베이스 연결 실패: ${error.message}`,
      details: { 
        error: error.message,
        url: process.env.DATABASE_URL ? 'Set' : 'Not set'
      },
      timestamp
    })
  }
}

async function testGoogleServiceAccount(results: TestResult[], timestamp: string) {
  try {
    console.log('🔍 Testing Google Service Account...')
    
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
      results.push({
        service: 'Google Service Account',
        status: 'error',
        message: `서비스 계정 파일 읽기 실패: ${fileError.message}`,
        details: { error: fileError.message },
        timestamp
      })
      return
    }
    
    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email']
    const missingFields = requiredFields.filter(field => !serviceAccount[field])
    
    if (missingFields.length > 0) {
      results.push({
        service: 'Google Service Account',
        status: 'error',
        message: `필수 필드 누락: ${missingFields.join(', ')}`,
        details: { missingFields },
        timestamp
      })
      return
    }
    
    // Test direct access token request
    console.log('🔐 Testing Google authentication...')
    
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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      results.push({
        service: 'Google Service Account',
        status: 'error',
        message: `액세스 토큰 획득 실패: ${tokenData.error || 'Unknown error'}`,
        details: tokenData,
        timestamp
      })
      return
    }
    
    // Test Analytics API access with direct token
    if (process.env.GA4_PROPERTY_ID) {
      try {
        console.log('📊 Testing GA4 API access...')
        const response = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
              metrics: [{ name: 'sessions' }],
              limit: 1
            })
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          results.push({
            service: 'Google Analytics API',
            status: 'success',
            message: `GA4 API 접근 성공 (Property: ${process.env.GA4_PROPERTY_ID})`,
            details: { 
              propertyId: process.env.GA4_PROPERTY_ID,
              hasData: data.rows && data.rows.length > 0
            },
            timestamp
          })
        } else {
          const errorData = await response.json()
          results.push({
            service: 'Google Analytics API',
            status: 'warning',
            message: `GA4 API 접근 실패: ${response.status} ${response.statusText}`,
            details: { 
              propertyId: process.env.GA4_PROPERTY_ID,
              error: errorData.error?.message || errorData.error
            },
            timestamp
          })
        }
      } catch (analyticsError: any) {
        results.push({
          service: 'Google Analytics API',
          status: 'warning',
          message: `GA4 API 접근 실패: ${analyticsError.message}`,
          details: { 
            propertyId: process.env.GA4_PROPERTY_ID,
            error: analyticsError.message
          },
          timestamp
        })
      }
    }
    
    results.push({
      service: 'Google Service Account',
      status: 'success',
      message: `Google 인증 성공 (${serviceAccount.client_email})`,
      details: {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        keyId: serviceAccount.private_key_id?.substring(0, 8) + '...'
      },
      timestamp
    })
    
  } catch (error: any) {
    console.error('❌ Google Service Account test failed:', error.message)
    
    results.push({
      service: 'Google Service Account',
      status: 'error',
      message: `Google 인증 실패: ${error.message}`,
      details: { error: error.message },
      timestamp
    })
  }
}

async function testGeminiAPI(results: TestResult[], timestamp: string) {
  try {
    console.log('🔍 Testing Gemini API...')
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_FREE_KEY
    
    if (!apiKey) {
      results.push({
        service: 'Gemini API',
        status: 'error',
        message: 'Gemini API 키가 설정되지 않음',
        timestamp
      })
      return
    }
    
    // Test Gemini API with a simple request
    const testPrompt = 'Hello, this is a test. Please respond with "Test successful".'
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt
              }
            ]
          }
        ]
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
      
      results.push({
        service: 'Gemini API',
        status: 'success',
        message: `Gemini API 연결 성공`,
        details: {
          model: 'gemini-1.5-flash',
          response: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''),
          hasApiKey: !!apiKey
        },
        timestamp
      })
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      results.push({
        service: 'Gemini API',
        status: 'error',
        message: `Gemini API 호출 실패: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          error: errorData.error?.message || errorData.error || 'Unknown error'
        },
        timestamp
      })
    }
    
  } catch (error: any) {
    console.error('❌ Gemini API test failed:', error.message)
    
    results.push({
      service: 'Gemini API',
      status: 'error',
      message: `Gemini API 테스트 실패: ${error.message}`,
      details: { error: error.message },
      timestamp
    })
  }
}

async function testEnvironmentVariables(results: TestResult[], timestamp: string) {
  try {
    console.log('🔍 Testing environment variables...')
    
    const requiredVars = [
      { name: 'DATABASE_URL', required: true, sensitive: true },
      { name: 'GA4_PROPERTY_ID', required: true, sensitive: false },
      { name: 'GOOGLE_SERVICE_ACCOUNT_KEY', required: true, sensitive: true },
      { name: 'GEMINI_API_KEY', required: true, sensitive: true },
      { name: 'JWT_SECRET', required: true, sensitive: true },
      { name: 'SUPER_USER_EMAIL', required: true, sensitive: false },
      { name: 'SUPER_USER_PASSWORD', required: true, sensitive: true },
    ]
    
    const optionalVars = [
      { name: 'GEMINI_API_FREE_KEY', required: false, sensitive: true },
      { name: 'NEXT_PUBLIC_SUPABASE_URL', required: false, sensitive: false },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: false, sensitive: true },
      { name: 'GSC_SITE_URL', required: false, sensitive: false },
      { name: 'NODE_ENV', required: false, sensitive: false },
      { name: 'PORT', required: false, sensitive: false },
    ]
    
    let missingRequired = 0
    let totalSet = 0
    
    // Test required variables
    for (const envVar of requiredVars) {
      const value = process.env[envVar.name]
      const isSet = !!value
      
      if (isSet) {
        totalSet++
        const displayValue = envVar.sensitive 
          ? (value.length > 10 ? value.substring(0, 4) + '***' + value.substring(value.length - 4) : '***')
          : value
          
        results.push({
          service: `Environment - ${envVar.name}`,
          status: 'success',
          message: `환경변수 설정됨`,
          details: { 
            value: displayValue,
            length: value.length,
            sensitive: envVar.sensitive
          },
          timestamp
        })
      } else {
        missingRequired++
        results.push({
          service: `Environment - ${envVar.name}`,
          status: 'error',
          message: `필수 환경변수 누락`,
          details: { required: true },
          timestamp
        })
      }
    }
    
    // Test optional variables
    for (const envVar of optionalVars) {
      const value = process.env[envVar.name]
      const isSet = !!value
      
      if (isSet) {
        totalSet++
        const displayValue = envVar.sensitive 
          ? (value.length > 10 ? value.substring(0, 4) + '***' + value.substring(value.length - 4) : '***')
          : value
          
        results.push({
          service: `Environment - ${envVar.name}`,
          status: 'success',
          message: `선택적 환경변수 설정됨`,
          details: { 
            value: displayValue,
            length: value.length,
            sensitive: envVar.sensitive,
            optional: true
          },
          timestamp
        })
      }
    }
    
    // Summary
    const totalVars = requiredVars.length + optionalVars.length
    results.push({
      service: 'Environment Variables Summary',
      status: missingRequired === 0 ? 'success' : 'warning',
      message: `환경변수 체크 완료: ${totalSet}/${totalVars} 설정됨, ${missingRequired}개 필수 변수 누락`,
      details: {
        totalVariables: totalVars,
        setVariables: totalSet,
        missingRequired: missingRequired,
        requiredCount: requiredVars.length,
        optionalCount: optionalVars.length
      },
      timestamp
    })
    
  } catch (error: any) {
    console.error('❌ Environment variables test failed:', error.message)
    
    results.push({
      service: 'Environment Variables',
      status: 'error',
      message: `환경변수 테스트 실패: ${error.message}`,
      details: { error: error.message },
      timestamp
    })
  }
}