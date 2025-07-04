import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: '인증 토큰이 없습니다.' }, { status: 401 })
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any

    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    // 사용자 정보 조회
    const userResult = await client.query(
      `SELECT "id", "email", "name", "role", "createdAt" 
       FROM "User" 
       WHERE "id" = $1`,
      [decoded.userId]
    )

    await client.end()

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    const user = userResult.rows[0]

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ error: '인증 토큰이 유효하지 않습니다.' }, { status: 401 })
  }
}
