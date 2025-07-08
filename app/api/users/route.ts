import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('📋 Fetching users list...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`✅ Found ${users.length} users`)
    
    return NextResponse.json({
      success: true,
      users
    })
  } catch (error: any) {
    console.error('❌ Error fetching users:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch users', 
        error: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('👤 Creating new user...')
    
    const { name, email, password, role = 'user' } = await request.json()
    
    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: '이름, 이메일, 비밀번호는 필수 입력 항목입니다.' 
        },
        { status: 400 }
      )
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { 
          success: false, 
          message: '비밀번호는 최소 8자 이상이어야 합니다.' 
        },
        { status: 400 }
      )
    }
    
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
    
    const validRoles = ['admin', 'user', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: '올바른 역할을 선택해주세요.' 
        },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: '이미 등록된 이메일입니다.' 
        },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true
      },
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
    
    console.log(`✅ User created successfully: ${user.email}`)
    
    return NextResponse.json({
      success: true,
      message: '사용자가 성공적으로 생성되었습니다.',
      user
    })
  } catch (error: any) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create user', 
        error: error.message 
      },
      { status: 500 }
    )
  }
}