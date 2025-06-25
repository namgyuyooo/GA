import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

const DEFAULT_CONTAINERS = [
  'GTM-N99ZMP6T'
]

async function getSettings() {
  const settings = await prisma.setting.findMany()
  return settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>)
}

async function getNumericContainerId(accessToken: string, accountId: string, publicId: string): Promise<string | null> {
  const response = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  if (!response.ok) {
    console.error('Failed to list GTM containers')
    return null
  }
  const { container } = await response.json()
  const foundContainer = (container || []).find((c: any) => c.publicId === publicId)
  return foundContainer ? foundContainer.containerId : null
}

export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings()

    const accountId = settings.GTM_ACCOUNT_ID
    const publicId = settings.GTM_PUBLIC_ID

    if (!publicId || !accountId || !settings.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.warn('GTM settings are incomplete, falling back to demo data.')
      return getDemoGTMData()
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
    } catch (e) {
      console.warn('Could not parse Service Account JSON, falling back to demo data.', e)
      return getDemoGTMData()
    }

    const jwt = require('jsonwebtoken')
    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/tagmanager.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      },
      serviceAccount.private_key,
      { algorithm: 'RS256' }
    )

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      console.warn('Failed to get GTM access token, falling back to demo data.')
      return getDemoGTMData()
    }

    const containerId = await getNumericContainerId(tokenData.access_token, accountId, publicId)
    if (!containerId) {
      console.warn(`No container found with Public ID ${publicId}, falling back to demo data.`)
      return getDemoGTMData()
    }

    try {
      const [containerRes, tagsRes, triggersRes, variablesRes] = await Promise.all([
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/1/tags`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/1/triggers`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/1/variables`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } })
      ])

      const containerData = containerRes.ok ? await containerRes.json() : null
      const tagsData = tagsRes.ok ? await tagsRes.json() : { tag: [] }
      const triggersData = triggersRes.ok ? await triggersRes.json() : { trigger: [] }
      const variablesData = variablesRes.ok ? await variablesRes.json() : { variable: [] }

      const processedData = processGTMData(containerData, tagsData, triggersData, variablesData)

      return NextResponse.json({
        success: true,
        data: processedData,
        message: '✅ Google Tag Manager 분석 데이터가 성공적으로 로드되었습니다.'
      })

    } catch (gtmError) {
      console.warn('GTM Analysis API: An error occurred during GTM API calls, using demo data:', gtmError)
      return getDemoGTMData()
    }

  } catch (error: any) {
    console.error('GTM Analysis API: A critical error occurred:', error)
    return NextResponse.json({
      error: 'Failed to load GTM analysis data',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, containerId, goals } = body

    if (!accountId || !containerId || !goals) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fs = require('fs')
    const path = require('path')
    const goalPath = path.join(process.cwd(), 'gtm-goals.json')

    const dataToWrite = {
      accountId,
      containerId,
      goals,
      updatedAt: new Date().toISOString()
    }

    fs.writeFileSync(goalPath, JSON.stringify(dataToWrite, null, 2), 'utf8')

    return NextResponse.json({ success: true, message: 'GTM Goals saved successfully.' })
  } catch (error: any) {
    console.error('Error saving GTM Goals:', error)
    return NextResponse.json({ error: 'Failed to save GTM Goals', details: error.message }, { status: 500 })
  }
}

// GTM 데이터 처리
function processGTMData(container: any, tags: any, triggers: any, variables: any) {
  const tagList = (tags.tag || []).map((tag: any) => ({
    id: tag.tagId,
    name: tag.name,
    type: tag.type,
    status: tag.paused ? 'paused' : 'active',
    firingTriggerId: tag.firingTriggerId || [],
    blockingTriggerId: tag.blockingTriggerId || [],
    parameter: tag.parameter || [],
    fingerprint: tag.fingerprint,
    isGoal: false, // 기본값
    goalPriority: 0,
    category: categorizeTag(tag.type),
    description: getTagDescription(tag.type)
  }))

  const triggerList = (triggers.trigger || []).map((trigger: any) => ({
    id: trigger.triggerId,
    name: trigger.name,
    type: trigger.type,
    filter: trigger.filter || [],
    parameter: trigger.parameter || [],
    fingerprint: trigger.fingerprint,
    category: categorizeTrigger(trigger.type)
  }))

  const variableList = (variables.variable || []).map((variable: any) => ({
    id: variable.variableId,
    name: variable.name,
    type: variable.type,
    parameter: variable.parameter || [],
    fingerprint: variable.fingerprint,
    category: categorizeVariable(variable.type)
  }))

  return {
    container: {
      name: container?.name || 'Demo Container',
      containerId: container?.containerId || 'GTM-N99ZMP6T',
      publicId: container?.publicId || 'GTM-N99ZMP6T',
      domainName: container?.domainName || ['rtm.ai', 'online-poc.rtm.ai'],
      fingerprint: container?.fingerprint || 'demo-fingerprint'
    },
    tags: tagList,
    triggers: triggerList,
    variables: variableList,
    summary: {
      totalTags: tagList.length,
      activeTags: tagList.filter((t: any) => t.status === 'active').length,
      pausedTags: tagList.filter((t: any) => t.status === 'paused').length,
      totalTriggers: triggerList.length,
      totalVariables: variableList.length,
      goalTags: tagList.filter((t: any) => t.isGoal).length
    }
  }
}

// 데모 데이터 생성 (UTM Goals 포함)
function getDemoGTMData() {
  // UTM Goals JSON 파일 로드
  const fs = require('fs')
  const path = require('path')

  let utmGoals: any[] = []
  const goalPath = path.join(process.cwd(), 'gtm-goals.json')

  try {
    if (!fs.existsSync(goalPath)) {
      // 파일이 없으면 기본 내용으로 생성
      const defaultGoals = {
        accountId: "1234567890",
        containerId: "GTM-N99ZMP6T",
        goals: []
      }
      fs.writeFileSync(goalPath, JSON.stringify(defaultGoals, null, 2), 'utf8')
      console.log('gtm-goals.json 파일이 생성되었습니다.')
    }

    const goalData = fs.readFileSync(goalPath, 'utf8')
    const goalConfig = JSON.parse(goalData)
    utmGoals = goalConfig.goals || []
  } catch (error: any) {
    console.warn('UTM Goals 파일을 처리하는 중 오류 발생:', error.message)
  }

  const demoTags = [
    {
      id: '1',
      name: 'Google Analytics 4 - GA4',
      type: 'gtagconfig',
      status: 'active',
      firingTriggerId: ['1', '2'],
      blockingTriggerId: [],
      parameter: [
        { key: 'config_id', value: 'G-XXXXXXXXXX' }
      ],
      fingerprint: 'demo-fingerprint-1',
      isGoal: false,
      goalPriority: 0,
      category: 'analytics',
      description: 'Google Analytics 4 측정 태그'
    },
    {
      id: '2',
      name: 'GA4 - Page View Event',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['1'],
      blockingTriggerId: [],
      parameter: [
        { key: 'event_name', value: 'page_view' },
        { key: 'send_to', value: 'G-XXXXXXXXXX' }
      ],
      fingerprint: 'demo-fingerprint-2',
      isGoal: true,
      goalPriority: 1,
      category: 'analytics',
      description: '페이지뷰 이벤트 추적'
    },
    {
      id: '3',
      name: 'GA4 - Button Click Event',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['3'],
      blockingTriggerId: [],
      parameter: [
        { key: 'event_name', value: 'button_click' },
        { key: 'send_to', value: 'G-XXXXXXXXXX' }
      ],
      fingerprint: 'demo-fingerprint-3',
      isGoal: false,
      goalPriority: 0,
      category: 'interaction',
      description: '버튼 클릭 이벤트 추적'
    },
    {
      id: '4',
      name: 'GA4 - Form Submit Event',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['4'],
      blockingTriggerId: [],
      parameter: [
        { key: 'event_name', value: 'form_submit' },
        { key: 'send_to', value: 'G-XXXXXXXXXX' }
      ],
      fingerprint: 'demo-fingerprint-4',
      isGoal: true,
      goalPriority: 2,
      category: 'conversion',
      description: '폼 제출 전환 이벤트'
    },
    {
      id: '5',
      name: 'Facebook Pixel - Base Code',
      type: 'facebookPixel',
      status: 'active',
      firingTriggerId: ['1'],
      blockingTriggerId: [],
      parameter: [
        { key: 'pixel_id', value: '1234567890123456' }
      ],
      fingerprint: 'demo-fingerprint-5',
      isGoal: false,
      goalPriority: 0,
      category: 'advertising',
      description: 'Facebook 픽셀 기본 코드'
    },
    {
      id: '6',
      name: 'Facebook Pixel - Purchase Event',
      type: 'facebookPixel',
      status: 'active',
      firingTriggerId: ['5'],
      blockingTriggerId: [],
      parameter: [
        { key: 'pixel_id', value: '1234567890123456' },
        { key: 'event', value: 'Purchase' }
      ],
      fingerprint: 'demo-fingerprint-6',
      isGoal: true,
      goalPriority: 3,
      category: 'conversion',
      description: '구매 완료 전환 이벤트'
    }
  ]

  // UTM Goals와 기본 데모 태그 병합
  const allTags = [...demoTags, ...utmGoals]

  const demoTriggers = [
    { id: '1', name: 'All Pages', type: 'pageview', category: 'pageview' },
    { id: '2', name: 'DOM Ready', type: 'domReady', category: 'page' },
    { id: '3', name: 'CTA Button Click', type: 'click', category: 'click' },
    { id: '4', name: 'Contact Form Submit', type: 'formSubmit', category: 'form' },
    { id: '5', name: 'Purchase Complete', type: 'customEvent', category: 'custom' }
  ]

  const demoVariables = [
    { id: '1', name: 'Page URL', type: 'url', category: 'page' },
    { id: '2', name: 'Page Title', type: 'pageTitle', category: 'page' },
    { id: '3', name: 'Click Element', type: 'clickElement', category: 'click' },
    { id: '4', name: 'Form ID', type: 'formId', category: 'form' },
    { id: '5', name: 'Custom User ID', type: 'customVariable', category: 'custom' }
  ]

  return NextResponse.json({
    success: true,
    containerId: 'GTM-N99ZMP6T',
    accountId: 'demo-account',
    data: {
      container: {
        name: 'RTM Analytics Container (Demo)',
        containerId: 'GTM-N99ZMP6T',
        publicId: 'GTM-N99ZMP6T',
        domainName: ['rtm.ai', 'online-poc.rtm.ai'],
        fingerprint: 'demo-container-fingerprint'
      },
      tags: allTags,
      triggers: demoTriggers,
      variables: demoVariables,
      summary: {
        totalTags: allTags.length,
        activeTags: allTags.filter(t => t.status === 'active').length,
        pausedTags: allTags.filter(t => t.status === 'paused').length,
        totalTriggers: demoTriggers.length,
        totalVariables: demoVariables.length,
        goalTags: allTags.filter(t => t.isGoal).length
      }
    },
    message: `✅ GTM 분석 데이터 로드 완료 (UTM Goals ${utmGoals.length}개 포함)`
  })
}

// 태그 카테고리 분류
function categorizeTag(type: string): string {
  const categories: { [key: string]: string } = {
    'gtagconfig': 'analytics',
    'gaEvent': 'analytics',
    'ua': 'analytics',
    'facebookPixel': 'advertising',
    'adwordsConversion': 'advertising',
    'html': 'custom',
    'img': 'tracking',
    'sp': 'custom'
  }
  return categories[type] || 'other'
}

// 트리거 카테고리 분류
function categorizeTrigger(type: string): string {
  const categories: { [key: string]: string } = {
    'pageview': 'pageview',
    'domReady': 'page',
    'windowLoaded': 'page',
    'click': 'click',
    'linkClick': 'click',
    'formSubmit': 'form',
    'timer': 'timer',
    'customEvent': 'custom',
    'historyChange': 'navigation'
  }
  return categories[type] || 'other'
}

// 변수 카테고리 분류
function categorizeVariable(type: string): string {
  const categories: { [key: string]: string } = {
    'url': 'page',
    'pageTitle': 'page',
    'referrer': 'page',
    'clickElement': 'click',
    'clickUrl': 'click',
    'formId': 'form',
    'customVariable': 'custom',
    'dataLayer': 'dataLayer'
  }
  return categories[type] || 'other'
}

// 태그 설명 생성
function getTagDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    'gtagconfig': 'Google Analytics 4 구성 태그',
    'gaEvent': 'Google Analytics 이벤트 태그',
    'ua': 'Universal Analytics 태그',
    'facebookPixel': 'Facebook 픽셀 태그',
    'adwordsConversion': 'Google Ads 전환 태그',
    'html': '커스텀 HTML 태그',
    'img': '이미지/픽셀 태그'
  }
  return descriptions[type] || '기타 태그'
}