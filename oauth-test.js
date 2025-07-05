const readline = require('readline')
const { google } = require('googleapis')
const fs = require('fs')

const secretPath = process.env.GOOGLE_OAUTH_SECRET_PATH || './secrets/google_oauth.json'
const secret = JSON.parse(fs.readFileSync(secretPath, 'utf-8'))
const CLIENT_ID = secret.client_id
const CLIENT_SECRET = secret.client_secret
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback'
const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function testOAuth() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

  // 1. 인증 URL 생성
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log('다음 URL로 이동하여 인증하세요:')
  console.log(authUrl)
  console.log('\n인증 후 받은 코드를 입력하세요:')

  rl.question('Authorization code: ', async (code) => {
    try {
      // 2. 코드를 토큰으로 교환
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      console.log('\n✅ 토큰 획득 성공!')
      console.log('Access Token:', tokens.access_token?.substring(0, 50) + '...')

      // 3. GA4 Management API로 계정 목록 조회
      console.log('\n📊 GA4 계정 목록 조회 중...')

      const analytics = google.analytics('v3')
      const accountsResponse = await analytics.management.accounts.list({
        auth: oauth2Client,
      })

      if (accountsResponse.data.items) {
        console.log('\n✅ 접근 가능한 GA 계정:')
        accountsResponse.data.items.forEach((account, index) => {
          console.log(`${index + 1}. ${account.name} (ID: ${account.id})`)
        })

        // 4. 첫 번째 계정의 속성 목록 조회
        if (accountsResponse.data.items.length > 0) {
          const firstAccountId = accountsResponse.data.items[0].id
          console.log(`\n📋 계정 ${firstAccountId}의 속성 목록 조회 중...`)

          const propertiesResponse = await analytics.management.webproperties.list({
            auth: oauth2Client,
            accountId: firstAccountId,
          })

          if (propertiesResponse.data.items) {
            console.log('\n✅ 접근 가능한 속성:')
            propertiesResponse.data.items.forEach((property, index) => {
              console.log(`${index + 1}. ${property.name} (ID: ${property.id})`)
            })
          } else {
            console.log('\n❌ 속성을 찾을 수 없습니다.')
          }
        }
      } else {
        console.log('\n❌ 접근 가능한 계정이 없습니다.')
      }

      // 5. GA4 Data API 테스트 (직접 fetch 사용)
      console.log('\n🔍 GA4 Data API 직접 테스트...')

      const testPropertyIds = ['462871516', '123456789'] // 테스트할 속성 ID들

      for (const propertyId of testPropertyIds) {
        try {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                metrics: [{ name: 'sessions' }],
              }),
            }
          )

          if (response.ok) {
            const data = await response.json()
            console.log(`✅ 속성 ${propertyId}: 접근 성공`)
            console.log(`   세션 수: ${data.rows?.[0]?.metricValues?.[0]?.value || 0}`)
          } else {
            const errorText = await response.text()
            console.log(
              `❌ 속성 ${propertyId}: ${response.status} - ${errorText.substring(0, 200)}...`
            )
          }
        } catch (error) {
          console.log(`❌ 속성 ${propertyId}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('❌ 오류:', error.message)
    }

    rl.close()
  })
}

testOAuth()
