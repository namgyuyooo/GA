import { NextRequest, NextResponse } from 'next/server'

const { PrismaClient } = require('@prisma/client')

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reportId = params.id

    const prisma = new PrismaClient()

    // 보고서 존재 여부 확인
    const report = await prisma.weeklyReport.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      await prisma.$disconnect()
      return NextResponse.json(
        {
          success: false,
          error: '보고서를 찾을 수 없습니다.',
        },
        { status: 404 }
      )
    }

    // 보고서 삭제
    await prisma.weeklyReport.delete({
      where: { id: reportId },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: '보고서가 성공적으로 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Weekly report delete error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '보고서 삭제에 실패했습니다.',
      },
      { status: 500 }
    )
  }
}
