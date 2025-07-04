import { GoogleAuth } from 'google-auth-library'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 서비스 계정 키를 환경변수에서 가져오기
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!serviceAccountKey) {
      return NextResponse.json(
        {
          error: 'Google Service Account Key not found in environment variables',
        },
        { status: 500 }
      )
    }

    // JSON 파싱
    const credentials = JSON.parse(serviceAccountKey)

    // Google Auth 클라이언트 생성
    const auth = new GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
      ],
    })

    // 인증 토큰 가져오기
    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    // GA4 Property ID
    const propertyId = process.env.GA4_PROPERTY_ID

    if (!propertyId) {
      return NextResponse.json(
        {
          error: 'GA4 Property ID not found in environment variables',
        },
        { status: 500 }
      )
    }

    // 간단한 GA4 API 테스트 (지난 7일간 페이지뷰)
    const ga4Response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
          ],
          limit: 10,
        }),
      }
    )

    if (!ga4Response.ok) {
      const errorText = await ga4Response.text()
      return NextResponse.json(
        {
          error: 'GA4 API Error',
          details: errorText,
          status: ga4Response.status,
        },
        { status: 500 }
      )
    }

    const ga4Data = await ga4Response.json()

    // Search Console 테스트
    const gscSiteUrl = process.env.GSC_SITE_URL || 'sc-domain:rtm.ai'

    const gscResponse = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(gscSiteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: '2024-06-18', // 7일 전
          endDate: '2024-06-25', // 오늘
          dimensions: ['query'],
          rowLimit: 10,
        }),
      }
    )

    let gscData = null
    if (gscResponse.ok) {
      gscData = await gscResponse.json()
    } else {
      const gscError = await gscResponse.text()
      gscData = { error: gscError, status: gscResponse.status }
    }

    return NextResponse.json({
      success: true,
      message: 'Service Account authentication successful!',
      data: {
        ga4: ga4Data,
        searchConsole: gscData,
        credentials: {
          projectId: credentials.project_id,
          clientEmail: credentials.client_email,
        },
      },
    })
  } catch (error: any) {
    console.error('Analytics API test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to test analytics APIs',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
