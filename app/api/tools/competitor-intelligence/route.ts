import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const keyword = searchParams.get('keyword')

    if (!domain || !keyword) {
      return NextResponse.json(
        { error: '도메인과 키워드가 필요합니다' },
        { status: 400 }
      )
    }

    // Brave Search API 호출
    const braveApiKey = process.env.BRAVE_SEARCH_API_KEY
    if (!braveApiKey) {
      return NextResponse.json(
        { error: 'Brave Search API 키가 설정되지 않았습니다' },
        { status: 500 }
      )
    }

    // site:domain.com keyword 형태로 검색
    const searchQuery = `site:${domain} "${keyword}"`
    
    const searchResponse = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=10`,
      {
        headers: {
          'X-Subscription-Token': braveApiKey,
          'Accept': 'application/json',
        }
      }
    )

    if (!searchResponse.ok) {
      console.error('Brave Search API 오류:', await searchResponse.text())
      return NextResponse.json(
        { error: 'Brave Search API 호출 실패' },
        { status: 500 }
      )
    }

    const searchData = await searchResponse.json()
    
    // 경쟁사 분석 데이터 처리
    const results = searchData.web?.results || []
    
    const analysis = {
      domain,
      keyword,
      totalResults: results.length,
      pages: results.map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        rank: results.indexOf(result) + 1,
      })),
      summary: {
        hasContent: results.length > 0,
        topRanking: results.length > 0 ? 1 : null,
        contentCount: results.length,
      }
    }

    return NextResponse.json({
      success: true,
      data: analysis,
      message: `${domain}의 "${keyword}" 키워드 분석 완료`
    })

  } catch (error: any) {
    console.error('경쟁사 분석 오류:', error)
    return NextResponse.json(
      {
        error: '경쟁사 분석 중 오류가 발생했습니다',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const { name, domain, description, industry, keywords } = body.competitor
      
      const competitor = await prisma.competitor.create({
        data: {
          name,
          domain,
          description,
          industry,
          keywords: keywords || [],
        }
      })

      return NextResponse.json({
        success: true,
        competitor,
        message: '경쟁사가 등록되었습니다'
      })
    }

    if (action === 'list') {
      const competitors = await prisma.competitor.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        competitors
      })
    }

    if (action === 'delete') {
      const { id } = body
      
      await prisma.competitor.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        message: '경쟁사가 삭제되었습니다'
      })
    }

    return NextResponse.json(
      { error: '지원하지 않는 액션입니다' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('경쟁사 관리 오류:', error)
    return NextResponse.json(
      {
        error: '경쟁사 관리 중 오류가 발생했습니다',
        details: error.message
      },
      { status: 500 }
    )
  }
}