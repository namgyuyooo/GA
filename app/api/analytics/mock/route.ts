import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock GA4 데이터 (실제 API 응답 형식과 동일)
    const mockGA4Data = {
      dimensionHeaders: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' }
      ],
      metricHeaders: [
        { name: 'activeUsers', type: 'TYPE_INTEGER' },
        { name: 'sessions', type: 'TYPE_INTEGER' },
        { name: 'screenPageViews', type: 'TYPE_INTEGER' }
      ],
      rows: [
        {
          dimensionValues: [
            { value: 'google' },
            { value: 'cpc' },
            { value: 'summer_sale_2024' }
          ],
          metricValues: [
            { value: '1234' },
            { value: '1456' },
            { value: '3200' }
          ]
        },
        {
          dimensionValues: [
            { value: 'facebook' },
            { value: 'social' },
            { value: 'brand_awareness' }
          ],
          metricValues: [
            { value: '890' },
            { value: '1120' },
            { value: '2100' }
          ]
        },
        {
          dimensionValues: [
            { value: 'newsletter' },
            { value: 'email' },
            { value: 'weekly_digest' }
          ],
          metricValues: [
            { value: '567' },
            { value: '645' },
            { value: '1250' }
          ]
        },
        {
          dimensionValues: [
            { value: 'instagram' },
            { value: 'social' },
            { value: 'product_launch' }
          ],
          metricValues: [
            { value: '423' },
            { value: '512' },
            { value: '980' }
          ]
        },
        {
          dimensionValues: [
            { value: 'youtube' },
            { value: 'video' },
            { value: 'tutorial_series' }
          ],
          metricValues: [
            { value: '321' },
            { value: '389' },
            { value: '750' }
          ]
        },
        {
          dimensionValues: [
            { value: '(direct)' },
            { value: '(none)' },
            { value: '(direct)' }
          ],
          metricValues: [
            { value: '2100' },
            { value: '2456' },
            { value: '4800' }
          ]
        }
      ],
      totals: [
        {
          metricValues: [
            { value: '5535' },
            { value: '6578' },
            { value: '13080' }
          ]
        }
      ]
    }

    // Mock Search Console 데이터
    const mockGSCData = {
      rows: [
        {
          keys: ['AI 마케팅 도구'],
          clicks: 245,
          impressions: 3200,
          ctr: 0.0765625,
          position: 3.2
        },
        {
          keys: ['UTM 매개변수 설정'],
          clicks: 189,
          impressions: 2800,
          ctr: 0.0675,
          position: 4.1
        },
        {
          keys: ['구글 애널리틱스 설정'],
          clicks: 156,
          impressions: 2100,
          ctr: 0.0743,
          position: 2.8
        },
        {
          keys: ['마케팅 자동화'],
          clicks: 134,
          impressions: 1950,
          ctr: 0.0687,
          position: 5.2
        },
        {
          keys: ['디지털 마케팅 분석'],
          clicks: 112,
          impressions: 1650,
          ctr: 0.0679,
          position: 3.9
        },
        {
          keys: ['웹 트래픽 분석'],
          clicks: 98,
          impressions: 1400,
          ctr: 0.07,
          position: 4.3
        },
        {
          keys: ['마케팅 캠페인 성과'],
          clicks: 87,
          impressions: 1200,
          ctr: 0.0725,
          position: 3.5
        },
        {
          keys: ['소셜미디어 분석'],
          clicks: 76,
          impressions: 1050,
          ctr: 0.0724,
          position: 4.7
        }
      ]
    }

    return NextResponse.json({
      success: true,
      message: 'Mock data for testing - 실제 API 활성화 후 실제 데이터로 대체됩니다',
      isMockData: true,
      data: {
        ga4: mockGA4Data,
        searchConsole: mockGSCData,
        credentials: {
          projectId: 'ga-auto-464002',
          clientEmail: 'utm-dashboard-reporter@ga-auto-464002.iam.gserviceaccount.com'
        },
        summary: {
          totalUsers: 5535,
          totalSessions: 6578,
          totalPageViews: 13080,
          totalClicks: 1097,
          totalImpressions: 15350,
          avgCTR: 7.14,
          avgPosition: 3.9
        }
      }
    })

  } catch (error: any) {
    console.error('Mock analytics API error:', error)
    return NextResponse.json({
      error: 'Failed to generate mock data',
      details: error.message
    }, { status: 500 })
  }
}