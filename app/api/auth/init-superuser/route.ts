import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // 환경변수에서 슈퍼유저 정보 가져오기
    const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL
    const SUPER_USER_PASSWORD = process.env.SUPER_USER_PASSWORD
    const SUPER_USER_NAME = process.env.SUPER_USER_NAME || 'Super Admin'

    if (!SUPER_USER_EMAIL || !SUPER_USER_PASSWORD) {
      return NextResponse.json(
        { error: '환경변수에 슈퍼유저 정보가 설정되지 않았습니다. SUPER_USER_EMAIL, SUPER_USER_PASSWORD를 설정해주세요.' },
        { status: 400 }
      )
    }

    // 이미 슈퍼유저가 존재하는지 확인
    const existingSuperUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })

    if (existingSuperUser) {
      return NextResponse.json(
        { error: '슈퍼유저가 이미 존재합니다.' },
        { status: 409 }
      )
    }

    // 같은 이메일의 사용자가 있는지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPER_USER_EMAIL }
    })

    if (existingUser) {
      // 기존 사용자를 슈퍼유저로 업그레이드
      const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 12)
      
      const updatedUser = await prisma.user.update({
        where: { email: SUPER_USER_EMAIL },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          name: SUPER_USER_NAME,
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
        message: '기존 사용자가 슈퍼유저로 업그레이드되었습니다.',
        user: updatedUser
      })
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 12)

    // 슈퍼유저 생성
    const user = await prisma.user.create({
      data: {
        email: SUPER_USER_EMAIL,
        password: hashedPassword,
        name: SUPER_USER_NAME,
        role: 'SUPER_ADMIN',
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
      message: '슈퍼유저가 생성되었습니다.',
      user
    })

  } catch (error) {
    console.error('Init superuser error:', error)
    return NextResponse.json(
      { error: '슈퍼유저 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}