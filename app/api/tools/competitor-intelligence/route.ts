import { NextRequest, NextResponse } from 'next/server'

interface CompetitorData {
  competitorName?: string
  homepageUrl?: string
  koreanName?: string
  englishName?: string
  relatedInfo?: string
  estimatedTraffic: number
  topKeywords: Array<{
    keyword: string
    rank: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const {
      competitorName,
      homepageUrl,
      koreanName,
      englishName,
      relatedInfo,
    }: {
      competitorName?: string
      homepageUrl?: string
      koreanName?: string
      englishName?: string
      relatedInfo?: string
    } = await request.json()

    if (!competitorName && !homepageUrl && !koreanName && !englishName && !relatedInfo) {
      return NextResponse.json(
        {
          success: false,
          message:
            'At least one competitor identifier (name, URL, Korean name, English name, or related info) is required',
        },
        { status: 400 }
      )
    }

    const displayCompetitorName = koreanName || englishName || competitorName || homepageUrl

    // Mock 데이터 - 실제로는 외부 경쟁사 분석 API (예: SimilarWeb, SEMrush) 호출
    const mockData: CompetitorData[] = [
      {
        competitorName: competitorName,
        homepageUrl: homepageUrl,
        koreanName: koreanName,
        englishName: englishName,
        relatedInfo: relatedInfo,
        estimatedTraffic: Math.floor(Math.random() * 1000000) + 100000, // 10만 ~ 110만 트래픽
        topKeywords: [
          { keyword: `${displayCompetitorName} 서비스`, rank: 1 },
          { keyword: `${displayCompetitorName} 가격`, rank: 2 },
          { keyword: `경쟁사 ${displayCompetitorName}`, rank: 3 },
          { keyword: `대안 ${displayCompetitorName}`, rank: 4 },
          { keyword: `리뷰 ${displayCompetitorName}`, rank: 5 },
        ],
      },
    ]

    return NextResponse.json({
      success: true,
      data: mockData,
    })
  } catch (error) {
    console.error('Competitor intelligence API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch competitor intelligence data',
      },
      { status: 500 }
    )
  }
}
