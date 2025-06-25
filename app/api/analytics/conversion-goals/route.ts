import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Goal 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId') || '464147982'

    const goals = await prisma.conversionGoal.findMany({
      where: {
        propertyId,
        isActive: true
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            conversionPaths: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      goals: goals.map(goal => ({
        ...goal,
        totalConversions: goal._count.conversionPaths
      }))
    })

  } catch (error: any) {
    console.error('Goals fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch conversion goals',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Goal 생성
export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      goalType,
      eventName,
      pagePath,
      revenueThreshold,
      durationSeconds,
      priority = 1,
      propertyId = '464147982'
    } = await request.json()

    // 유효성 검사
    if (!name || !goalType) {
      return NextResponse.json({
        error: 'Name and goalType are required'
      }, { status: 400 })
    }

    // goalType별 필수 필드 검사
    if (goalType === 'EVENT' && !eventName) {
      return NextResponse.json({
        error: 'eventName is required for EVENT type goals'
      }, { status: 400 })
    }

    if (goalType === 'PAGE_VIEW' && !pagePath) {
      return NextResponse.json({
        error: 'pagePath is required for PAGE_VIEW type goals'
      }, { status: 400 })
    }

    const goal = await prisma.conversionGoal.create({
      data: {
        name,
        description,
        goalType,
        eventName,
        pagePath,
        revenueThreshold,
        durationSeconds,
        priority,
        propertyId
      }
    })

    return NextResponse.json({
      success: true,
      goal,
      message: `전환 목표 '${name}'이 생성되었습니다.`
    })

  } catch (error: any) {
    console.error('Goal creation error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Goal name already exists for this property'
      }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Failed to create conversion goal',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Goal 수정
export async function PUT(request: NextRequest) {
  try {
    const {
      id,
      name,
      description,
      goalType,
      eventName,
      pagePath,
      revenueThreshold,
      durationSeconds,
      priority,
      isActive
    } = await request.json()

    if (!id) {
      return NextResponse.json({
        error: 'Goal ID is required'
      }, { status: 400 })
    }

    const goal = await prisma.conversionGoal.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(goalType && { goalType }),
        ...(eventName !== undefined && { eventName }),
        ...(pagePath !== undefined && { pagePath }),
        ...(revenueThreshold !== undefined && { revenueThreshold }),
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(priority && { priority }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      goal,
      message: `전환 목표가 수정되었습니다.`
    })

  } catch (error: any) {
    console.error('Goal update error:', error)
    return NextResponse.json({
      error: 'Failed to update conversion goal',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Goal 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'Goal ID is required'
      }, { status: 400 })
    }

    // 소프트 삭제 (isActive = false)
    const goal = await prisma.conversionGoal.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `전환 목표 '${goal.name}'이 삭제되었습니다.`
    })

  } catch (error: any) {
    console.error('Goal deletion error:', error)
    return NextResponse.json({
      error: 'Failed to delete conversion goal',
      details: error.message
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}