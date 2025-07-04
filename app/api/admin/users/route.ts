import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 인증 확인 함수
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    throw new Error('인증 토큰이 없습니다.')
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true }
  })

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    throw new Error('관리자 권한이 필요합니다.')
  }

  return user
}

// 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request)

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      users
    })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: error instanceof Error && error.message.includes('권한') ? 403 : 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 새 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const currentUser = await verifyAuth(request)
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // SUPER_ADMIN만 다른 ADMIN을 생성할 수 있음
    if (role === 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: '슈퍼관리자만 관리자를 생성할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 유효한 역할인지 확인
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        emailVerified: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: '사용자가 생성되었습니다.',
      user
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '사용자 생성 중 오류가 발생했습니다.' },
      { status: error instanceof Error && error.message.includes('권한') ? 403 : 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}