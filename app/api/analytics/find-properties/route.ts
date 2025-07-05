import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Not authenticated',
        },
        { status: 401 }
      )
    }

    // 1. GA4 Admin API로 계정 목록 조회
    const accountsResponse = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.log('Accounts API error:', errorText)
    }

    let ga4Properties = []

    // 2. GA4 Admin API가 실패하면 다른 방법 시도
    // Test properties including user-specified ones
    const testPropertyIds = [
      '464147982', // Homepage
      '482625214', // POC
      '483589217', // POC-Langing
    ]

    const workingProperties = []

    for (const propertyId of testPropertyIds) {
      try {
        console.log(`Testing property: ${propertyId}`)

        const testResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
              metrics: [{ name: 'sessions' }],
            }),
          }
        )

        if (testResponse.ok) {
          const data = await testResponse.json()
          workingProperties.push({
            propertyId,
            sessions: data.rows?.[0]?.metricValues?.[0]?.value || 0,
            status: 'accessible',
          })
          console.log(`✅ Property ${propertyId}: accessible`)
        } else {
          const errorText = await testResponse.text()
          workingProperties.push({
            propertyId,
            status: 'failed',
            error: errorText.substring(0, 200),
          })
          console.log(`❌ Property ${propertyId}: ${testResponse.status}`)
        }
      } catch (error) {
        workingProperties.push({
          propertyId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      testResults: workingProperties,
      recommendation: workingProperties.find((p) => p.status === 'accessible')?.propertyId || null,
    })
  } catch (error) {
    console.error('Find Properties API Error:', error)

    return NextResponse.json(
      {
        error: 'Failed to find accessible properties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
