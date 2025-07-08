import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// 키워드 그룹 목록 조회
export async function GET() {
  try {
    const groups = await prisma.keywordCohortGroup.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // JSON 문자열을 배열로 변환
    const processedGroups = groups.map((group) => ({
      ...group,
      keywords: JSON.parse(String(group.keywords)),
    }))

    return NextResponse.json({
      success: true,
      groups: processedGroups,
      message: `${processedGroups.length}개의 키워드 그룹을 로드했습니다.`,
    })
  } catch (error: any) {
    console.error('Keyword groups load error:', error)
    return NextResponse.json(
      {
        error: 'Failed to load keyword groups',
        details: error.message,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 키워드 그룹 생성/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, group } = body

    if (action === 'create') {
      // 새 그룹 생성
      const newGroup = await prisma.keywordCohortGroup.create({
        data: {
          name: group.name,
          description: group.description,
          color: group.color,
          keywords: JSON.stringify(group.keywords),
          isActive: true,
        },
      })

      return NextResponse.json({
        success: true,
        group: {
          ...newGroup,
          keywords: JSON.parse(String(newGroup.keywords)),
        },
        message: '키워드 그룹이 생성되었습니다.',
      })
    } else if (action === 'update') {
      // 그룹 수정
      const updatedGroup = await prisma.keywordCohortGroup.update({
        where: { id: group.id },
        data: {
          name: group.name,
          description: group.description,
          color: group.color,
          keywords: JSON.stringify(group.keywords),
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        group: {
          ...updatedGroup,
          keywords: JSON.parse(String(updatedGroup.keywords)),
        },
        message: '키워드 그룹이 수정되었습니다.',
      })
    } else if (action === 'delete') {
      // 그룹 삭제 (소프트 삭제)
      await prisma.keywordCohortGroup.update({
        where: { id: group.id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: '키워드 그룹이 삭제되었습니다.',
      })
    } else {
      return NextResponse.json(
        {
          error: 'Invalid action',
          message: '지원하지 않는 작업입니다.',
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Keyword group operation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process keyword group operation',
        details: error.message,
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
