import { NextRequest, NextResponse } from 'next/server'

const { PrismaClient } = require('@prisma/client')

// Ensure DATABASE_URL is set correctly
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db'
}

export async function GET() {
  try {
    const prisma = new PrismaClient()
    
    const schedule = await prisma.weeklyReportSchedule.findFirst({
      where: { isActive: true }
    })

    await prisma.$disconnect()

    if (schedule) {
      return NextResponse.json({
        success: true,
        schedule: {
          id: schedule.id,
          name: schedule.name,
          isActive: schedule.isActive,
          dayOfWeek: schedule.dayOfWeek,
          hour: schedule.hour,
          minute: schedule.minute,
          timezone: schedule.timezone,
          recipients: schedule.recipients ? JSON.parse(schedule.recipients) : [],
          includeSummary: schedule.includeSummary,
          includeIssues: schedule.includeIssues,
          includeAI: schedule.includeAI,
          aiPrompt: schedule.aiPrompt,
          propertyIds: schedule.propertyIds ? JSON.parse(schedule.propertyIds) : []
        }
      })
    } else {
      // 기본 스케줄 반환
      return NextResponse.json({
        success: true,
        schedule: {
          name: '주간 보고서',
          isActive: true,
          dayOfWeek: 1, // 월요일
          hour: 10,
          minute: 30,
          timezone: 'Asia/Seoul',
          recipients: [],
          includeSummary: true,
          includeIssues: true,
          includeAI: true,
          aiPrompt: '다음 데이터를 분석하여 주요 인사이트와 개선점을 제시해주세요. 비즈니스 관점에서 실용적인 조언을 포함해주세요.',
          propertyIds: ['464147982']
        }
      })
    }
  } catch (error) {
    console.error('Weekly schedule fetch error:', error)
    return NextResponse.json({
      success: false,
      error: '스케줄을 불러오는데 실패했습니다.'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { schedule } = await request.json()
    const prisma = new PrismaClient()

    // 기존 스케줄이 있으면 업데이트, 없으면 생성
    const existingSchedule = await prisma.weeklyReportSchedule.findFirst({
      where: { isActive: true }
    })

    const scheduleData = {
      name: schedule.name,
      isActive: schedule.isActive,
      dayOfWeek: schedule.dayOfWeek,
      hour: schedule.hour,
      minute: schedule.minute,
      timezone: schedule.timezone,
      recipients: JSON.stringify(schedule.recipients || []),
      includeSummary: schedule.includeSummary,
      includeIssues: schedule.includeIssues,
      includeAI: schedule.includeAI,
      aiPrompt: schedule.aiPrompt,
      propertyIds: JSON.stringify(schedule.propertyIds || [])
    }

    if (existingSchedule) {
      await prisma.weeklyReportSchedule.update({
        where: { id: existingSchedule.id },
        data: scheduleData
      })
    } else {
      await prisma.weeklyReportSchedule.create({
        data: scheduleData
      })
    }

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: '주간 보고서 스케줄이 저장되었습니다.'
    })
  } catch (error) {
    console.error('Weekly schedule save error:', error)
    return NextResponse.json({
      success: false,
      error: '스케줄 저장에 실패했습니다.'
    }, { status: 500 })
  }
} 