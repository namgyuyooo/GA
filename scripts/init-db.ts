import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Initializing database...')
    
    // 기존 테이블들이 있는지 확인
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User'
    `
    
    console.log('Existing User table:', tableExists)
    
    if (Array.isArray(tableExists) && tableExists.length === 0) {
      console.log('User table does not exist. Creating schema...')
      
      // User 테이블 생성
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT,
          "email" TEXT UNIQUE,
          "emailVerified" TIMESTAMP,
          "image" TEXT,
          "password" TEXT,
          "role" TEXT NOT NULL DEFAULT 'USER',
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      
      console.log('User table created successfully')
    } else {
      console.log('User table already exists')
    }
    
    // 다른 필수 테이블들도 확인 및 생성
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        UNIQUE("provider", "providerAccountId")
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP NOT NULL
      )
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT UNIQUE NOT NULL,
        "expires" TIMESTAMP NOT NULL,
        UNIQUE("identifier", "token")
      )
    `
    
    console.log('Database initialization completed successfully')
    
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })