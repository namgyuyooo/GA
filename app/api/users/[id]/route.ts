import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`👤 Updating user ${params.id}...`)
    
    const { isActive, role, name, email } = await request.json()
    const userId = params.id
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: '사용자를 찾을 수 없습니다.' 
        },
        { status: 404 }
      )
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }
    
    if (role && ['admin', 'user', 'viewer'].includes(role)) {
      updateData.role = role
    }
    
    if (name) {
      updateData.name = name
    }
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { 
            success: false, 
            message: '올바른 이메일 형식을 입력해주세요.' 
          },
          { status: 400 }
        )
      }
      
      // Check if email is already taken by another user
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      })
      
      if (existingEmailUser) {
        return NextResponse.json(
          { 
            success: false, 
            message: '이미 사용 중인 이메일입니다.' 
          },
          { status: 409 }
        )
      }
      
      updateData.email = email
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    console.log(`✅ User updated successfully: ${updatedUser.email}`)
    
    return NextResponse.json({
      success: true,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.',
      user: updatedUser
    })
  } catch (error: any) {
    console.error('❌ Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user', 
        error: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🗑️ Deleting user ${params.id}...`)
    
    const userId = params.id
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: '사용자를 찾을 수 없습니다.' 
        },
        { status: 404 }
      )
    }
    
    // Prevent deleting the last admin user
    if (existingUser.role === 'admin') {
      const adminCount = await prisma.user.count({
        where: { 
          role: 'admin',
          isActive: true
        }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json(
          { 
            success: false, 
            message: '마지막 관리자 계정은 삭제할 수 없습니다.' 
          },
          { status: 400 }
        )
      }
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })
    
    console.log(`✅ User deleted successfully: ${existingUser.email}`)
    
    return NextResponse.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    })
  } catch (error: any) {
    console.error('❌ Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete user', 
        error: error.message 
      },
      { status: 500 }
    )
  }
}