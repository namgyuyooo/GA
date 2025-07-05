import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 })
    }

    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    // 사용자 조회
    const userResult = await client.query(
      `SELECT "id", "email", "name", "password", "role", "createdAt" 
       FROM "User" 
       WHERE "email" = $1`,
      [email]
    )

    await client.end()

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' }, { status: 401 })
    }

    const user = userResult.rows[0]

    if (!user.password) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' }, { status: 401 })
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' }, { status: 401 })
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    )

    // 응답에 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
