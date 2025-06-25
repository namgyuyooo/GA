require('dotenv').config({ path: '.env.local' })
const jwt = require('jsonwebtoken')

async function checkGTMAccounts() {
  try {
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    console.log('🔍 GTM 계정 검색 중...')
    console.log('서비스 계정:', serviceAccount.client_email)
    
    // JWT 토큰 생성
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/tagmanager.readonly',
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

    // 모든 GTM 계정 조회
    const accountsResponse = await fetch('https://tagmanager.googleapis.com/tagmanager/v2/accounts', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })

    const accountsData = await accountsResponse.json()
    
    if (accountsResponse.ok && accountsData.account) {
      console.log('\n📋 접근 가능한 GTM 계정 목록:')
      accountsData.account.forEach((account, index) => {
        console.log(`${index + 1}. 계정명: ${account.name}`)
        console.log(`   계정 ID: ${account.accountId}`)
        console.log(`   경로: ${account.path}`)
        console.log('   ---')
      })

      // 각 계정의 컨테이너 조회
      for (const account of accountsData.account) {
        console.log(`\n🏷️  계정 "${account.name}" (${account.accountId})의 컨테이너:`)
        
        const containersResponse = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${account.accountId}/containers`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        })

        const containersData = await containersResponse.json()
        
        if (containersResponse.ok && containersData.container) {
          containersData.container.forEach((container, index) => {
            console.log(`  ${index + 1}. 컨테이너명: ${container.name}`)
            console.log(`     Public ID: ${container.publicId}`)
            console.log(`     Container ID: ${container.containerId}`)
            console.log(`     도메인: ${container.domainName?.join(', ') || 'N/A'}`)
            console.log('     ---')
          })
        } else {
          console.log('   컨테이너가 없거나 접근 권한이 없습니다.')
        }
      }
    } else {
      console.log('❌ GTM 계정 조회 실패:')
      console.log('상태:', accountsResponse.status)
      console.log('응답:', accountsData)
      console.log('\n💡 가능한 원인:')
      console.log('1. 서비스 계정에 GTM 접근 권한이 없음')
      console.log('2. Tag Manager API가 활성화되지 않음')
      console.log('3. 잘못된 서비스 계정 키')
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
  }
}

checkGTMAccounts()