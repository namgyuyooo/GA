import { NextRequest, NextResponse } from 'next/server'

const { PrismaClient } = require('@prisma/client')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id
    const format = new URL(request.url).searchParams.get('format') || 'json'
    
    const prisma = new PrismaClient()
    
    // 보고서 조회
    const report = await prisma.weeklyReport.findUnique({
      where: { id: reportId }
    })
    
    if (!report) {
      await prisma.$disconnect()
      return NextResponse.json({
        success: false,
        error: '보고서를 찾을 수 없습니다.'
      }, { status: 404 })
    }
    
    // 보고서 데이터 파싱
    let reportData
    try {
      reportData = JSON.parse(report.reportData)
    } catch (error) {
      console.error('Report data parsing error:', error)
      await prisma.$disconnect()
      return NextResponse.json({
        success: false,
        error: '보고서 데이터 파싱에 실패했습니다.'
      }, { status: 500 })
    }
    
    await prisma.$disconnect()
    
    // 형식에 따른 응답 생성
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        report: {
          id: report.id,
          title: report.title,
          startDate: report.startDate,
          endDate: report.endDate,
          totalSessions: report.totalSessions,
          totalUsers: report.totalUsers,
          totalConversions: report.totalConversions,
          avgEngagementRate: report.avgEngagementRate,
          totalClicks: report.totalClicks,
          totalImpressions: report.totalImpressions,
          avgCtr: report.avgCtr,
          avgPosition: report.avgPosition,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          data: reportData
        }
      })
    } else if (format === 'csv') {
      // CSV 형식으로 변환
      const csvData = generateCSV(report, reportData)
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${report.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.csv"`
        }
      })
    } else if (format === 'pdf') {
      // PDF 형식으로 변환 (간단한 텍스트 기반)
      const pdfData = generatePDF(report, reportData)
      
      return new NextResponse(pdfData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.pdf"`
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '지원하지 않는 형식입니다. (json, csv, pdf)'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Weekly report download error:', error)
    return NextResponse.json({
      success: false,
      error: '보고서 다운로드에 실패했습니다.'
    }, { status: 500 })
  }
}

function generateCSV(report: any, reportData: any): string {
  const headers = [
    '제목', '시작일', '종료일', '총 세션', '총 사용자', '총 전환', 
    '평균 참여율', '총 클릭', '총 노출', '평균 CTR', '평균 순위', '생성일'
  ]
  
  const row = [
    report.title,
    new Date(report.startDate).toLocaleDateString('ko-KR'),
    new Date(report.endDate).toLocaleDateString('ko-KR'),
    report.totalSessions,
    report.totalUsers,
    report.totalConversions,
    (report.avgEngagementRate * 100).toFixed(1) + '%',
    report.totalClicks || 0,
    report.totalImpressions || 0,
    ((report.avgCtr || 0) * 100).toFixed(2) + '%',
    (report.avgPosition || 0).toFixed(1),
    new Date(report.createdAt).toLocaleString('ko-KR')
  ]
  
  return [headers.join(','), row.join(',')].join('\n')
}

function generatePDF(report: any, reportData: any): string {
  // 간단한 텍스트 기반 PDF (실제로는 PDF 라이브러리 사용 권장)
  const content = `
주간 분석 보고서

제목: ${report.title}
기간: ${new Date(report.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(report.endDate).toLocaleDateString('ko-KR')}

기본 메트릭:
- 총 세션: ${report.totalSessions.toLocaleString()}
- 총 사용자: ${report.totalUsers.toLocaleString()}
- 총 전환: ${report.totalConversions.toLocaleString()}
- 평균 참여율: ${(report.avgEngagementRate * 100).toFixed(1)}%

AI 분석: ${reportData.aiAnalysis ? '포함' : '미포함'}
사용 모델: ${reportData.selectedModel || 'N/A'}

생성일: ${new Date(report.createdAt).toLocaleString('ko-KR')}
  `.trim()
  
  return content
} 