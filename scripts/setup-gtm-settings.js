const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function setupGTMSettings() {
  try {
    console.log('🚀 GTM 설정을 데이터베이스에 추가 중...')

    // GTM Account ID 추가
    await prisma.setting.upsert({
      where: { key: 'GTM_ACCOUNT_ID' },
      update: { value: process.env.GTM_ACCOUNT_ID || '6016627088' },
      create: { key: 'GTM_ACCOUNT_ID', value: process.env.GTM_ACCOUNT_ID || '6016627088' }
    })

    // GTM Public ID 추가
    await prisma.setting.upsert({
      where: { key: 'GTM_PUBLIC_ID' },
      update: { value: process.env.GTM_PUBLIC_ID || 'GTM-N99ZMP6T' },
      create: { key: 'GTM_PUBLIC_ID', value: process.env.GTM_PUBLIC_ID || 'GTM-N99ZMP6T' }
    })

    // Google Service Account JSON 추가
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      await prisma.setting.upsert({
        where: { key: 'GOOGLE_SERVICE_ACCOUNT_JSON' },
        update: { value: process.env.GOOGLE_SERVICE_ACCOUNT_KEY },
        create: { key: 'GOOGLE_SERVICE_ACCOUNT_JSON', value: process.env.GOOGLE_SERVICE_ACCOUNT_KEY }
      })
    }

    console.log('✅ GTM 설정이 성공적으로 추가되었습니다!')

    // 설정 확인
    const settings = await prisma.setting.findMany()
    console.log('📋 현재 데이터베이스 설정:')
    settings.forEach(setting => {
      if (setting.key === 'GOOGLE_SERVICE_ACCOUNT_JSON') {
        console.log(`  ${setting.key}: [서비스 계정 JSON - ${setting.value.length} characters]`)
      } else {
        console.log(`  ${setting.key}: ${setting.value}`)
      }
    })

  } catch (error) {
    console.error('❌ GTM 설정 추가 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupGTMSettings()