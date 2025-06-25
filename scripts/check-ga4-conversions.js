require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')

async function checkGA4Conversions() {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    const propertyId = process.env.GA4_PROPERTY_ID || '464147982'
    
    console.log('🔍 GA4 전환 이벤트 확인 중...')
    console.log('Property ID:', propertyId)
    
    // JWT 토큰 생성
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }, serviceAccount.private_key, { algorithm: 'RS256' })

    // 액세스 토큰 획득
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('❌ 액세스 토큰 획득 실패:', tokenData)
      return
    }

    console.log('✅ 액세스 토큰 획득 성공')

    // 전환 이벤트 목록 조회
    const conversionEventsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'conversions' }
          ],
          orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
          limit: 20
        })
      }
    )

    if (conversionEventsResponse.ok) {
      const eventsData = await conversionEventsResponse.json()
      
      console.log('\n📊 전환 이벤트 분석 (최근 30일):')
      console.log('================================')
      
      if (eventsData.rows && eventsData.rows.length > 0) {
        eventsData.rows.forEach((row, index) => {
          const eventName = row.dimensionValues[0].value
          const eventCount = Number(row.metricValues[0].value)
          const conversions = Number(row.metricValues[1].value)
          const conversionRate = eventCount > 0 ? ((conversions / eventCount) * 100).toFixed(2) : '0.00'
          
          console.log(`${index + 1}. 이벤트: ${eventName}`)
          console.log(`   총 발생: ${eventCount.toLocaleString()}회`)
          console.log(`   전환: ${conversions.toLocaleString()}회`)
          console.log(`   전환율: ${conversionRate}%`)
          console.log(`   전환 여부: ${conversions > 0 ? '✅ 전환 이벤트' : '❌ 일반 이벤트'}`)
          console.log('   ---')
        })
      } else {
        console.log('이벤트 데이터가 없습니다.')
      }
    } else {
      console.log('❌ 이벤트 데이터 조회 실패:', conversionEventsResponse.status)
    }

    // 전체 전환 요약
    const summaryResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'conversions' },
            { name: 'sessions' },
            { name: 'totalRevenue' },
            { name: 'activeUsers' }
          ]
        })
      }
    )

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json()
      const row = summaryData.rows?.[0]?.metricValues || []
      
      console.log('\n📈 전체 전환 요약 (최근 30일):')
      console.log('================================')
      console.log(`총 전환수: ${Number(row[0]?.value || 0).toLocaleString()}`)
      console.log(`총 세션: ${Number(row[1]?.value || 0).toLocaleString()}`)
      console.log(`총 수익: ₩${Number(row[2]?.value || 0).toLocaleString()}`)
      console.log(`총 사용자: ${Number(row[3]?.value || 0).toLocaleString()}`)
      
      const conversions = Number(row[0]?.value || 0)
      const sessions = Number(row[1]?.value || 0)
      const conversionRate = sessions > 0 ? ((conversions / sessions) * 100).toFixed(2) : '0.00'
      console.log(`전환율: ${conversionRate}%`)
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

checkGA4Conversions()