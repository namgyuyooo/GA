import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, secretKey } = await request.json()

    // 슈퍼유저 생성을 위한 비밀키 확인
    const SUPER_USER_SECRET = process.env.SUPER_USER_SECRET || 'rtm2018!@'

    if (secretKey !== SUPER_USER_SECRET) {
      return NextResponse.json({ error: '슈퍼유저 생성 권한이 없습니다.' }, { status: 403 })
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }

    // 이미 존재하는 이메일인지 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 409 })
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 슈퍼유저 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: '슈퍼유저가 생성되었습니다.',
      user,
    })
  } catch (error) {
    console.error('Create superuser error:', error)
    return NextResponse.json({ error: '슈퍼유저 생성 중 오류가 발생했습니다.' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
