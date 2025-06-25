const fs = require('fs')
const path = require('path')

// UTM 캠페인 데이터
const utmCampaigns = [
  {
    memo: "구글 디스플레이광고 - 프로모션",
    landingUrl: "http://rtm.ai",
    source: "sms",
    medium: "social", 
    campaign: "campain_name",
    content: "",
    term: "",
    finalUrl: "http://rtm.ai?utm_source=sms&utm_medium=social&utm_campaign=campain_name"
  },
  {
    memo: "온라인 poc 프로젝트 페이지",
    landingUrl: "https://poc-request.hubble-engine.rtm.ai/project/auth",
    source: "email",
    medium: "email",
    campaign: "welcome_auto", 
    content: "",
    term: "",
    finalUrl: "https://poc-request.hubble-engine.rtm.ai/project/auth?utm_source=email&utm_medium=email&utm_campaign=welcome_auto"
  },
  {
    memo: "온라인 poc 신청페이지 aw 감사메일",
    landingUrl: "https://poc-request.hubble-engine.rtm.ai/",
    source: "email",
    medium: "email",
    campaign: "aw_thanks_mail",
    content: "",
    term: "",
    finalUrl: "https://poc-request.hubble-engine.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=aw_thanks_mail"
  },
  {
    memo: "온라인 poc 랜딩페이지",
    landingUrl: "https://online-poc.rtm.ai/",
    source: "email", 
    medium: "email",
    campaign: "bluepoint_demoday-offline",
    content: "",
    term: "",
    finalUrl: "https://online-poc.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=bluepoint_demoday-offline"
  },
  {
    memo: "온라인 poc 신청페이지 메일",
    landingUrl: "http://rtm.ai",
    source: "email",
    medium: "email", 
    campaign: "250319_email_onlicepoc_welcome",
    content: "",
    term: "",
    finalUrl: "http://rtm.ai?utm_source=email&utm_medium=email&utm_campaign=250319_email_onlicepoc_welcome"
  },
  {
    memo: "홈페이지-poc 랜딩 이동",
    landingUrl: "https://online-poc.rtm.ai/",
    source: "homepage",
    medium: "btn",
    campaign: "basic",
    content: "",
    term: "",
    finalUrl: "https://online-poc.rtm.ai/?utm_source=homepage&utm_medium=btn&utm_campaign=basic"
  },
  {
    memo: "온라인 poc 신청페이지 메일",
    landingUrl: "https://online-poc.rtm.ai/",
    source: "email",
    medium: "email",
    campaign: "250424_email_poc_maillist",
    content: "",
    term: "",
    finalUrl: "https://online-poc.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=250424_email_poc_maillist"
  },
  {
    memo: "홈페이지-엔진 신청",
    landingUrl: "https://www.rtm.ai/kr/hubble/engine",
    source: "email",
    medium: "email",
    campaign: "250604_email-engine_maillist",
    content: "",
    term: "",
    finalUrl: "https://www.rtm.ai/kr/hubble/engine?utm_source=email&utm_medium=email&utm_campaign=250604_email-engine_maillist"
  }
]

// Google Sheets 삽입 함수
async function insertToGoogleSheets() {
  try {
    console.log('🚀 Google Sheets에 UTM 캠페인 데이터 삽입 시작...')
    
    // Service Account 파일 읽기
    const serviceAccountPath = path.join(__dirname, '../ga-auto-464002-672370fda082.json')
    const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
    const serviceAccount = JSON.parse(serviceAccountData)
    
    // JWT 토큰 생성
    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    )

    // Access Token 요청
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token: ' + JSON.stringify(tokenData))
    }
    
    console.log('✅ Google API 인증 완료')

    // Google Sheets 스프레드시트 ID
    const SPREADSHEET_ID = '17k0Cl7qJbkowaLmtNRpjvdmqJ7His0127aalnzhIucg'
    const SHEET_NAME = 'UTM_Campaigns'
    
    // 헤더 행 먼저 삽입
    const headers = [
      'ID', '캠페인명', '소스', '매체', '캠페인', 'UTM_Term', 'UTM_Content', 
      'URL', '설명', '상태', '생성일시', '관리메모', '랜딩페이지'
    ]
    
    console.log('📝 헤더 행 삽입...')
    
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A1:M1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [headers]
        }),
      }
    )
    
    if (!headerResponse.ok) {
      const errorText = await headerResponse.text()
      throw new Error('Header insert failed: ' + errorText)
    }
    
    console.log('✅ 헤더 행 삽입 완료')

    // UTM 캠페인 데이터 준비
    const values = utmCampaigns.map((campaign, index) => [
      String(index + 1), // ID
      `${campaign.campaign}_${campaign.source}_${campaign.medium}`, // 캠페인명
      campaign.source, // 소스
      campaign.medium, // 매체 
      campaign.campaign, // 캠페인
      campaign.term || '', // UTM_Term
      campaign.content || '', // UTM_Content
      campaign.finalUrl, // URL
      campaign.memo || '', // 설명
      'ACTIVE', // 상태
      new Date().toISOString(), // 생성일시
      campaign.memo, // 관리메모
      campaign.landingUrl // 랜딩페이지
    ])

    console.log(`📊 ${values.length}개 캠페인 데이터 삽입 중...`)

    // 데이터 삽입
    const insertResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A2:M${values.length + 1}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        }),
      }
    )

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text()
      throw new Error('Data insert failed: ' + errorText)
    }

    const result = await insertResponse.json()
    console.log('✅ UTM 캠페인 데이터 삽입 완료!')
    console.log(`📈 업데이트된 행 수: ${result.updatedRows}`)
    console.log(`📋 업데이트된 셀 수: ${result.updatedCells}`)
    
    // 삽입된 데이터 요약
    console.log('\n📊 삽입된 캠페인 요약:')
    utmCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.memo}`)
      console.log(`   소스: ${campaign.source} | 매체: ${campaign.medium} | 캠페인: ${campaign.campaign}`)
      console.log(`   URL: ${campaign.finalUrl}`)
      console.log('')
    })
    
    console.log('🎉 Google Sheets 삽입 작업이 성공적으로 완료되었습니다!')
    console.log(`🔗 스프레드시트: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`)

  } catch (error) {
    console.error('❌ Google Sheets 삽입 중 오류 발생:', error)
    throw error
  }
}

// 로컬 API 삽입 함수 (대안)
async function insertViaAPI() {
  try {
    console.log('🔄 로컬 API를 통한 UTM 캠페인 삽입 시작...')
    
    for (let i = 0; i < utmCampaigns.length; i++) {
      const campaign = utmCampaigns[i]
      
      console.log(`📝 ${i + 1}/${utmCampaigns.length}: ${campaign.memo} 삽입 중...`)
      
      const response = await fetch('http://localhost:3000/api/utm/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: campaign.landingUrl,
          source: campaign.source,
          medium: campaign.medium,
          campaign: campaign.campaign,
          term: campaign.term,
          content: campaign.content,
          description: campaign.memo,
          url: campaign.finalUrl
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ 성공: ${result.name}`)
      } else {
        const error = await response.json()
        console.log(`⚠️ 실패: ${error.error}`)
      }
      
      // 요청 간 잠시 대기 (API 제한 방지)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log('🎉 로컬 API 삽입 작업 완료!')
    
  } catch (error) {
    console.error('❌ 로컬 API 삽입 중 오류 발생:', error)
  }
}

// CSV 파일 생성 함수
function generateCSV() {
  console.log('📄 CSV 파일 생성 중...')
  
  const headers = [
    'ID', '관리메모', '랜딩페이지URL', '소스', '매체', '캠페인', 
    'UTM_Content', 'UTM_Term', 'finalURL', '생성일시'
  ]
  
  const csvData = [
    headers.join(','),
    ...utmCampaigns.map((campaign, index) => [
      index + 1,
      `"${campaign.memo}"`,
      campaign.landingUrl,
      campaign.source,
      campaign.medium,
      campaign.campaign,
      campaign.content || '',
      campaign.term || '',
      `"${campaign.finalUrl}"`,
      new Date().toISOString()
    ].join(','))
  ].join('\n')
  
  const csvPath = path.join(__dirname, '../utm-campaigns.csv')
  fs.writeFileSync(csvPath, csvData, 'utf8')
  
  console.log(`✅ CSV 파일 생성 완료: ${csvPath}`)
  return csvPath
}

// 메인 실행 함수
async function main() {
  console.log('🚀 UTM 캠페인 데이터 삽입 스크립트 시작\n')
  
  const args = process.argv.slice(2)
  const method = args[0] || 'sheets'
  
  try {
    switch (method) {
      case 'sheets':
        await insertToGoogleSheets()
        break
      case 'api':
        await insertViaAPI()
        break
      case 'csv':
        generateCSV()
        break
      default:
        console.log('사용법:')
        console.log('  node import-utm-campaigns.js sheets  # Google Sheets 직접 삽입')
        console.log('  node import-utm-campaigns.js api     # 로컬 API 사용')
        console.log('  node import-utm-campaigns.js csv     # CSV 파일 생성')
        return
    }
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error.message)
    process.exit(1)
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main()
}

module.exports = { utmCampaigns, insertToGoogleSheets, insertViaAPI, generateCSV }