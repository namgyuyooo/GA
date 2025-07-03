import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const groups = await prisma.keywordCohortGroup.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Parse keywords JSON for each group
    const groupsWithParsedKeywords = groups.map(group => ({
      ...group,
      keywords: JSON.parse(typeof group.keywords === 'string' ? group.keywords : JSON.stringify(group.keywords) || '[]')
    }))

    return NextResponse.json({
      success: true,
      groups: groupsWithParsedKeywords
    })
  } catch (error: any) {
    console.error('Error fetching keyword cohort groups:', error)
    return NextResponse.json({
      error: 'Failed to fetch keyword cohort groups',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, keywords } = body

    // Validate required fields
    if (!name || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json({
        error: 'Name and keywords array are required'
      }, { status: 400 })
    }

    // Check if group name already exists
    const existingGroup = await prisma.keywordCohortGroup.findUnique({
      where: { name }
    })

    if (existingGroup) {
      return NextResponse.json({
        error: 'Group name already exists'
      }, { status: 409 })
    }

    // Create new group
    const newGroup = await prisma.keywordCohortGroup.create({
      data: {
        name,
        description: description || null,
        color: color || '#3B82F6',
        keywords: JSON.stringify(keywords)
      }
    })

    return NextResponse.json({
      success: true,
      group: {
        ...newGroup,
        keywords: JSON.parse(typeof newGroup.keywords === 'string' ? newGroup.keywords : JSON.stringify(newGroup.keywords))
      }
    })
  } catch (error: any) {
    console.error('Error creating keyword cohort group:', error)
    return NextResponse.json({
      error: 'Failed to create keyword cohort group',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, color, keywords, isActive } = body

    if (!id) {
      return NextResponse.json({
        error: 'Group ID is required'
      }, { status: 400 })
    }

    // Check if group exists
    const existingGroup = await prisma.keywordCohortGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({
        error: 'Group not found'
      }, { status: 404 })
    }

    // Update group
    const updatedGroup = await prisma.keywordCohortGroup.update({
      where: { id },
      data: {
        name: name || existingGroup.name,
        description: description !== undefined ? description : existingGroup.description,
        color: color || existingGroup.color,
        keywords: keywords ? JSON.stringify(keywords) : existingGroup.keywords,
        isActive: isActive !== undefined ? isActive : existingGroup.isActive
      }
    })

    return NextResponse.json({
      success: true,
      group: {
        ...updatedGroup,
        keywords: JSON.parse(typeof updatedGroup.keywords === 'string' ? updatedGroup.keywords : JSON.stringify(updatedGroup.keywords))
      }
    })
  } catch (error: any) {
    console.error('Error updating keyword cohort group:', error)
    return NextResponse.json({
      error: 'Failed to update keyword cohort group',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'Group ID is required'
      }, { status: 400 })
    }

    // Check if group exists
    const existingGroup = await prisma.keywordCohortGroup.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({
        error: 'Group not found'
      }, { status: 404 })
    }

    // Delete group
    await prisma.keywordCohortGroup.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting keyword cohort group:', error)
    return NextResponse.json({
      error: 'Failed to delete keyword cohort group',
      details: error.message
    }, { status: 500 })
  }
}