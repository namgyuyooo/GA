import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 직접 SQL로 데이터베이스 테스트
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      return NextResponse.json(
        {
          error: 'DATABASE_URL not found',
        },
        { status: 500 }
      )
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

    // Insight 테이블 확인 및 생성
    const insightTableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Insight'
    `)

    if (insightTableResult.rows.length === 0) {
      await client.query(`
        CREATE TABLE "Insight" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "type" TEXT NOT NULL,
          "propertyId" TEXT NOT NULL,
          "model" TEXT NOT NULL,
          "prompt" TEXT NOT NULL,
          "result" TEXT NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `)
    }

    // PromptTemplate 테이블 확인 및 생성
    const promptTableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'PromptTemplate'
    `)

    if (promptTableResult.rows.length === 0) {
      await client.query(`
        CREATE TABLE "PromptTemplate" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "description" TEXT,
          "prompt" TEXT NOT NULL,
          "variables" JSONB,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE("name", "type")
        )
      `)
    }

    await client.end()

    return NextResponse.json({
      success: true,
      tables: {
        User: {
          exists: tableResult.rows.length > 0,
          created: !!createResult,
        },
        Insight: {
          exists: insightTableResult.rows.length > 0,
          created: insightTableResult.rows.length === 0,
        },
        PromptTemplate: {
          exists: promptTableResult.rows.length > 0,
          created: promptTableResult.rows.length === 0,
        },
      },
      message: 'Database tables checked and created if needed',
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      {
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
