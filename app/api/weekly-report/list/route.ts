import { NextRequest, NextResponse } from 'next/server'

const { PrismaClient } = require('@prisma/client')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const propertyId = searchParams.get('propertyId')

    const prisma = new PrismaClient()

    // 필터 조건 구성
    const where: any = {}
    if (propertyId) {
      where.reportData = {
        contains: `"propertyId":"${propertyId}"`,
      }
    }

    // 총 개수 조회
    const totalCount = await prisma.weeklyReport.count({ where })

    // 페이지네이션 계산
    const skip = (page - 1) * limit

    // 보고서 목록 조회
    const reports = await prisma.weeklyReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        totalSessions: true,
        totalUsers: true,
        totalConversions: true,
        avgEngagementRate: true,
        createdAt: true,
        reportData: true,
      },
    })

    // 보고서 데이터 파싱 및 정리
    const formattedReports = reports.map((report) => {
      let reportData = null
      try {
        reportData = JSON.parse(report.reportData)
      } catch (error) {
        console.error('Report data parsing error:', error)
      }

      return {
        id: report.id,
        title: report.title,
        startDate: report.startDate,
        endDate: report.endDate,
        totalSessions: report.totalSessions,
        totalUsers: report.totalUsers,
        totalConversions: report.totalConversions,
        avgEngagementRate: report.avgEngagementRate,
        createdAt: report.createdAt,
        propertyId: reportData?.propertyId,
        isTest: reportData?.isTest || false,
        hasAI: !!reportData?.aiAnalysis,
        selectedModel: reportData?.selectedModel,
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    })
  } catch (error) {
    console.error('Weekly report list error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '보고서 목록을 불러오는데 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
