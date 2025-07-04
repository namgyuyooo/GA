import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 직접 SQL로 데이터베이스 테스트
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json({
        error: 'DATABASE_URL not found'
      }, { status: 500 })
    }

    // PostgreSQL 클라이언트로 직접 연결
    const { Client } = require('pg')
    const client = new Client({
      connectionString: databaseUrl,
    })

    await client.connect()

    // 테이블 존재 여부 확인
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User'
    `)

    let createResult = null
    if (tableResult.rows.length === 0) {
      // User 테이블 생성
      createResult = await client.query(`
        CREATE TABLE "User" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "name" TEXT,
          "email" TEXT UNIQUE,
          "emailVerified" TIMESTAMP,
          "image" TEXT,
          "password" TEXT,
          "role" TEXT NOT NULL DEFAULT 'USER',
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `)
    }

    await client.end()

    return NextResponse.json({
      success: true,
      tableExists: tableResult.rows.length > 0,
      created: !!createResult,
      message: tableResult.rows.length > 0 ? 'User table already exists' : 'User table created'
    })

  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { error: 'Database test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}