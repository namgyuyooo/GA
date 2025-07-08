const fs = require('fs')
const path = require('path')

// UTM 캠페인 데이터를 Goal로 강제 등록하는 스크립트

async function importUTMAsGoals() {
  try {
    console.log('🚀 UTM 캠페인을 GTM Goal로 강제 등록 시작...')

    // CSV 파일 읽기
    const csvPath = path.join(__dirname, '../utm-campaigns.csv')

    if (!fs.existsSync(csvPath)) {
      throw new Error('utm-campaigns.csv 파일을 찾을 수 없습니다.')
    }

    const csvData = fs.readFileSync(csvPath, 'utf8')
    const lines = csvData.split('\n')
    const headers = lines[0].split(',')

    console.log('📄 CSV 헤더:', headers)

    // CSV 데이터 파싱
    const utmCampaigns = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',')
        const campaign = {}

        headers.forEach((header, index) => {
          // 따옴표 제거
          campaign[header.trim()] = values[index] ? values[index].replace(/"/g, '').trim() : ''
        })

        utmCampaigns.push(campaign)
      }
    }

    console.log(`📊 총 ${utmCampaigns.length}개의 UTM 캠페인 발견`)

    // UTM 캠페인을 GTM Goal 태그로 변환
    const gtmGoalTags = utmCampaigns.map((campaign, index) => {
      const campaignName = campaign['캠페인'] || campaign['campaign'] || `Campaign_${index + 1}`
      const source = campaign['소스'] || campaign['source'] || 'unknown'
      const medium = campaign['매체'] || campaign['medium'] || 'unknown'
      const memo = campaign['관리메모'] || campaign['memo'] || ''

      return {
        id: `utm_goal_${index + 1}`,
        name: `UTM Goal - ${campaignName}`,
        type: 'gaEvent',
        status: 'active',
        firingTriggerId: ['utm_trigger_' + (index + 1)],
        blockingTriggerId: [],
        parameter: [
          { key: 'event_name', value: 'utm_campaign_goal' },
          { key: 'send_to', value: 'G-XXXXXXXXXX' },
          { key: 'utm_source', value: source },
          { key: 'utm_medium', value: medium },
          { key: 'utm_campaign', value: campaignName },
          { key: 'custom_parameter_1', value: memo },
        ],
        fingerprint: `utm-goal-${index + 1}-fingerprint`,
        isGoal: true,
        goalPriority: index + 1,
        category: 'conversion',
        description: `UTM 캠페인 Goal: ${memo || campaignName}`,
        originalUTM: campaign,
      }
    })

    // Goal 설정 파일 생성
    const goalConfig = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      totalGoals: gtmGoalTags.length,
      goals: gtmGoalTags,
      settings: {
        autoTrackUTM: true,
        goalPriorityMode: 'sequential',
        conversionWindow: 30, // days
      },
    }

    const outputPath = path.join(__dirname, '../gtm-goals.json')
    fs.writeFileSync(outputPath, JSON.stringify(goalConfig, null, 2), 'utf8')

    console.log('✅ GTM Goal 설정 파일 생성 완료!')
    console.log(`📁 파일 위치: ${outputPath}`)

    // Goal 요약 출력
    console.log('\n📊 생성된 GTM Goal 요약:')
    gtmGoalTags.forEach((goal, index) => {
      console.log(`${index + 1}. ${goal.name}`)
      console.log(
        `   - 소스/매체: ${goal.parameter.find((p) => p.key === 'utm_source')?.value}/${goal.parameter.find((p) => p.key === 'utm_medium')?.value}`
      )
      console.log(`   - 캠페인: ${goal.parameter.find((p) => p.key === 'utm_campaign')?.value}`)
      console.log(`   - 우선순위: ${goal.goalPriority}`)
      console.log(`   - 설명: ${goal.description}`)
      console.log('')
    })

    // API 업데이트를 위한 스크립트 생성
    await generateAPIUpdateScript(gtmGoalTags)

    console.log('🎉 UTM 캠페인 Goal 등록이 완료되었습니다!')
    console.log('💡 이제 GTM 분석 페이지에서 Goal 태그들을 확인할 수 있습니다.')
  } catch (error) {
    console.error('❌ UTM Goal 등록 중 오류 발생:', error.message)
    throw error
  }
}

// API 업데이트를 위한 스크립트 생성
async function generateAPIUpdateScript(goalTags) {
  const updateScript = `
// GTM API 업데이트 스크립트 (자동 생성됨)
// 이 코드를 GTM 분석 API에 통합하여 Goal 데이터를 로드하세요

const loadUTMGoals = () => {
  const goalTags = ${JSON.stringify(goalTags, null, 2)};
  
  // 기존 데모 태그와 UTM Goal 태그 병합
  const mergedTags = [...demoTags, ...goalTags];
  
  return {
    tags: mergedTags,
    goalTags: goalTags,
    totalGoals: goalTags.length
  };
};

// 사용 예시:
// const { tags, goalTags } = loadUTMGoals();
// console.log('총 Goal 수:', goalTags.length);
`

  const scriptPath = path.join(__dirname, '../gtm-api-update.js')
  fs.writeFileSync(scriptPath, updateScript, 'utf8')

  console.log(`📝 API 업데이트 스크립트 생성: ${scriptPath}`)
}

// 메인 실행
if (require.main === module) {
  importUTMAsGoals()
    .then(() => {
      console.log('✅ 스크립트 실행 완료')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error)
      process.exit(1)
    })
}

module.exports = { importUTMAsGoals }
