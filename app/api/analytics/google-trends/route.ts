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

import googleTrends from 'google-trends-api'

async function fetchGoogleTrends(keyword: string, timeframe: string, geo: string): Promise<TrendsData> {
  const interestOverTimeData = await googleTrends.interestOverTime({ keyword, startTime: new Date(new Date().setMonth(new Date().getMonth() - 3)), geo })
  const relatedQueriesData = await googleTrends.relatedQueries({ keyword, startTime: new Date(new Date().setMonth(new Date().getMonth() - 3)), geo })
  const relatedTopicsData = await googleTrends.relatedTopics({ keyword, startTime: new Date(new Date().setMonth(new Date().getMonth() - 3)), geo })
  const interestByRegionData = await googleTrends.interestByRegion({ keyword, startTime: new Date(new Date().setMonth(new Date().getMonth() - 3)), geo, resolution: 'REGION' })

  const parsedInterestOverTime = JSON.parse(interestOverTimeData).default.timelineData.map((item: any) => ({
    time: item.formattedTime,
    value: item.value[0]
  }))

  const parsedRelatedQueries = JSON.parse(relatedQueriesData).default.rankedList[0]
  const topQueries = parsedRelatedQueries ? parsedRelatedQueries.rankedKeyword.map((item: any) => ({
    query: item.query,
    value: item.value
  })) : []
  const risingQueries = parsedRelatedQueries ? parsedRelatedQueries.rankedKeyword.map((item: any) => ({
    query: item.query,
    value: item.value
  })) : []

  const parsedRelatedTopics = JSON.parse(relatedTopicsData).default.rankedList[0]
  const topTopics = parsedRelatedTopics ? parsedRelatedTopics.rankedKeyword.map((item: any) => ({
    topic: item.topic.title,
    value: item.value
  })) : []
  const risingTopics = parsedRelatedTopics ? parsedRelatedTopics.rankedKeyword.map((item: any) => ({
    topic: item.topic.title,
    value: item.value
  })) : []

  const parsedGeoMap = JSON.parse(interestByRegionData).default.geoMapData.map((item: any) => ({
    geoCode: item.geoCode,
    geoName: item.geoName,
    value: item.value[0]
  }))

  const trendsData: TrendsData = {
    keyword,
    interestOverTime: parsedInterestOverTime,
    relatedQueries: {
      top: topQueries,
      rising: risingQueries
    },
    relatedTopics: {
      top: topTopics,
      rising: risingTopics
    },
    geoMap: parsedGeoMap
  }

  return trendsData
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