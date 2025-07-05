import { GoogleAuth } from 'google-auth-library'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!serviceAccountKey) {
      return NextResponse.json(
        {
          error: 'Google Service Account Key not found',
        },
        { status: 500 }
      )
    }

    const credentials = JSON.parse(serviceAccountKey)

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    })

    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    // GA4 Admin API로 사용 가능한 속성 목록 가져오기
    const propertiesResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/properties',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let propertiesData = null
    if (propertiesResponse.ok) {
      propertiesData = await propertiesResponse.json()
    } else {
      const errorText = await propertiesResponse.text()
      propertiesData = { error: errorText, status: propertiesResponse.status }
    }

    // 현재 설정된 Property ID로 테스트
    const currentPropertyId = process.env.GA4_PROPERTY_ID || '464147982'

    const testResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${currentPropertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }],
          limit: 1,
        }),
      }
    )

    let testResult = null
    if (testResponse.ok) {
      testResult = await testResponse.json()
    } else {
      const errorText = await testResponse.text()
      testResult = { error: errorText, status: testResponse.status }
    }

    return NextResponse.json({
      serviceAccount: {
        email: credentials.client_email,
        projectId: credentials.project_id,
      },
      currentPropertyId,
      availableProperties: propertiesData,
      testResult,
      instructions: {
        step1: 'Google Analytics > 관리 > 속성 액세스 관리',
        step2: `서비스 계정 이메일 추가: ${credentials.client_email}`,
        step3: '역할: 뷰어 선택',
        step4: '권한 추가 후 5-10분 대기',
      },
    })
  } catch (error: any) {
    console.error('Property check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check properties',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
