import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

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

    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()

    // 이미 슈퍼유저가 존재하는지 확인
    const existingSuperUser = await client.query(
      `SELECT * FROM "User" WHERE "role" = 'SUPER_ADMIN' LIMIT 1`
    )

    if (existingSuperUser.rows.length > 0) {
      await client.end()
      return NextResponse.json(
        { error: '슈퍼유저가 이미 존재합니다.' },
        { status: 409 }
      )
    }

    // 같은 이메일의 사용자가 있는지 확인
    const existingUser = await client.query(
      `SELECT * FROM "User" WHERE "email" = $1`,
      [SUPER_USER_EMAIL]
    )

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 12)

    let user
    if (existingUser.rows.length > 0) {
      // 기존 사용자를 슈퍼유저로 업그레이드
      const updateResult = await client.query(
        `UPDATE "User" 
         SET "password" = $1, "role" = 'SUPER_ADMIN', "name" = $2, "emailVerified" = NOW(), "updatedAt" = NOW()
         WHERE "email" = $3
         RETURNING "id", "email", "name", "role", "createdAt"`,
        [hashedPassword, SUPER_USER_NAME, SUPER_USER_EMAIL]
      )

      user = updateResult.rows[0]

      await client.end()

      return NextResponse.json({
        success: true,
        message: '기존 사용자가 슈퍼유저로 업그레이드되었습니다.',
        user
      })
    } else {
      // 새 슈퍼유저 생성
      const insertResult = await client.query(
        `INSERT INTO "User" ("id", "email", "password", "name", "role", "emailVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'SUPER_ADMIN', NOW(), NOW(), NOW())
         RETURNING "id", "email", "name", "role", "createdAt"`,
        [SUPER_USER_EMAIL, hashedPassword, SUPER_USER_NAME]
      )

      user = insertResult.rows[0]

      await client.end()

      return NextResponse.json({
        success: true,
        message: '슈퍼유저가 생성되었습니다.',
        user
      })
    }

  } catch (error) {
    console.error('Init superuser error:', error)
    return NextResponse.json(
      { error: '슈퍼유저 초기화 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}