import { NextRequest, NextResponse } from 'next/server'

// Google Trends는 공식 API가 없으므로 pytrends (Python 라이브러리) 또는
// 비공식 라이브러리를 사용해야 합니다.
// 여기서는 google-trends-api npm 패키지를 사용하겠습니다.

interface TrendsRequest {
  keyword: string
  timeframe?: string // 'today 3-m', 'today 12-m', etc.
  geo?: string // 'KR' for Korea
  category?: number
}

interface TrendsData {
  keyword: string
  interestOverTime: Array<{
    time: string
    value: number
  }>
  relatedQueries: {
    top: Array<{
      query: string
      value: number
    }>
    rising: Array<{
      query: string
      value: number
    }>
  }
  relatedTopics: {
    top: Array<{
      topic: string
      value: number
    }>
    rising: Array<{
      topic: string
      value: number
    }>
  }
  geoMap: Array<{
    geoCode: string
    geoName: string
    value: number
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, timeframe = 'today 3-m', geo = 'KR' }: TrendsRequest = await request.json()

    if (!keyword) {
      return NextResponse.json({
        success: false,
        error: 'Keyword is required'
      }, { status: 400 })
    }

    // Google Trends 데이터를 가져오는 함수
    const trendsData = await fetchGoogleTrends(keyword, timeframe, geo)

    return NextResponse.json({
      success: true,
      data: trendsData
    })

  } catch (error) {
    console.error('Google Trends API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Google Trends data'
    }, { status: 500 })
  }
}

async function fetchGoogleTrends(keyword: string, timeframe: string, geo: string): Promise<TrendsData> {
  // 실제 구현에서는 google-trends-api나 다른 라이브러리를 사용
  // 현재는 Mock 데이터를 반환합니다.
  
  // Mock 데이터 - 실제로는 Google Trends API 호출
  const mockTrendsData: TrendsData = {
    keyword,
    interestOverTime: generateMockTimeSeriesData(),
    relatedQueries: {
      top: [
        { query: `${keyword} 솔루션`, value: 100 },
        { query: `${keyword} 기술`, value: 85 },
        { query: `${keyword} 산업`, value: 75 },
        { query: `${keyword} 자동화`, value: 70 },
        { query: `${keyword} 시스템`, value: 65 },
        { query: `${keyword} 제조`, value: 60 },
        { query: `${keyword} 분석`, value: 55 },
        { query: `${keyword} 플랫폼`, value: 50 },
        { query: `${keyword} 서비스`, value: 45 },
        { query: `${keyword} 도입`, value: 40 }
      ],
      rising: [
        { query: `${keyword} AI`, value: 500 },
        { query: `${keyword} 머신러닝`, value: 450 },
        { query: `${keyword} 디지털 전환`, value: 400 },
        { query: `${keyword} 스마트팩토리`, value: 350 },
        { query: `${keyword} IoT`, value: 300 }
      ]
    },
    relatedTopics: {
      top: [
        { topic: '인공지능', value: 100 },
        { topic: '제조업', value: 90 },
        { topic: '자동화', value: 85 },
        { topic: '데이터 분석', value: 80 },
        { topic: '스마트 팩토리', value: 75 }
      ],
      rising: [
        { topic: '생성형 AI', value: 1000 },
        { topic: '디지털 트윈', value: 800 },
        { topic: '엣지 컴퓨팅', value: 600 },
        { topic: '예측 유지보수', value: 500 },
        { topic: '컴퓨터 비전', value: 400 }
      ]
    },
    geoMap: [
      { geoCode: 'KR-11', geoName: '서울특별시', value: 100 },
      { geoCode: 'KR-26', geoName: '부산광역시', value: 85 },
      { geoCode: 'KR-27', geoName: '대구광역시', value: 70 },
      { geoCode: 'KR-30', geoName: '대전광역시', value: 65 },
      { geoCode: 'KR-29', geoName: '광주광역시', value: 60 },
      { geoCode: 'KR-28', geoName: '인천광역시', value: 75 },
      { geoCode: 'KR-31', geoName: '울산광역시', value: 55 },
      { geoCode: 'KR-43', geoName: '충청북도', value: 45 },
      { geoCode: 'KR-44', geoName: '충청남도', value: 50 },
      { geoCode: 'KR-42', geoName: '강원도', value: 35 }
    ]
  }

  return mockTrendsData
}

function generateMockTimeSeriesData() {
  const data = []
  const now = new Date()
  
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // 제조업 AI 키워드는 점진적 상승 트렌드 + 일부 변동성
    const baseValue = Math.max(20, 30 + (90 - i) * 0.5) // 기본 상승 트렌드
    const seasonality = Math.sin((90 - i) * 0.1) * 10 // 계절성
    const randomVariation = (Math.random() - 0.5) * 20 // 무작위 변동
    
    data.push({
      time: date.toISOString().split('T')[0],
      value: Math.round(Math.max(0, Math.min(100, baseValue + seasonality + randomVariation)))
    })
  }
  
  return data
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')
  const timeframe = searchParams.get('timeframe') || 'today 3-m'
  const geo = searchParams.get('geo') || 'KR'

  if (!keyword) {
    return NextResponse.json({
      success: false,
      error: 'Keyword parameter is required'
    }, { status: 400 })
  }

  try {
    const trendsData = await fetchGoogleTrends(keyword, timeframe, geo)
    
    return NextResponse.json({
      success: true,
      data: trendsData
    })
  } catch (error) {
    console.error('Google Trends API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Google Trends data'
    }, { status: 500 })
  }
}