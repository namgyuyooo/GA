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
    const { searchParams } = new URL(request.url)
    const dataMode = searchParams.get('dataMode') || 'realtime'
    
    const settings = await getSettings()

    const accountId = settings.GTM_ACCOUNT_ID
    const publicId = settings.GTM_PUBLIC_ID

    if (!publicId || !accountId) {
      console.error('GTM 설정이 누락되었습니다. 설정 페이지에서 GTM 정보를 입력해주세요.')
      return NextResponse.json({
        error: 'GTM 설정이 누락되었습니다',
        message: '설정 페이지에서 GTM_ACCOUNT_ID, GTM_PUBLIC_ID를 입력해주세요.',
        needsSetup: true
      }, { status: 400 })
    }

    // DB 모드인 경우 데이터베이스에서 데이터 로드
    if (dataMode === 'database') {
      console.log('DB 모드로 GTM 데이터 요청됨')
    }

    // /secrets 폴더에서 서비스 계정 JSON 파일 읽기
    const fs = require('fs')
    const path = require('path')
    
    let serviceAccount
    try {
      const serviceAccountPath = path.join(process.cwd(), 'secrets/ga-auto-464002-672370fda082.json')
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8')
      serviceAccount = JSON.parse(serviceAccountData)
    } catch (fileError) {
      console.error('서비스 계정 파일 오류:', fileError)
      return NextResponse.json({
        error: '서비스 계정 파일을 찾을 수 없습니다',
        message: 'secrets/ga-auto-464002-672370fda082.json 파일을 확인해주세요.',
        needsSetup: true
      }, { status: 500 })
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
      console.error('GTM 액세스 토큰 획득 실패:', tokenData)
      return NextResponse.json({
        error: 'GTM 액세스 토큰을 획득할 수 없습니다',
        message: '서비스 계정 권한을 확인해주세요.',
        needsSetup: true
      }, { status: 401 })
    }

    const containerId = await getNumericContainerId(tokenData.access_token, accountId, publicId)
    if (!containerId) {
      console.error(`컨테이너를 찾을 수 없습니다: ${publicId}`)
      return NextResponse.json({
        error: 'GTM 컨테이너를 찾을 수 없습니다',
        message: `Public ID '${publicId}'에 해당하는 컨테이너가 존재하지 않거나 접근 권한이 없습니다.`,
        needsSetup: true
      }, { status: 404 })
    }

    try {
      // 먼저 워크스페이스 목록 확인
      const workspacesResponse = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces`, {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      })
      
      let workspaceId = '1' // 기본값
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        
        // 기본 워크스페이스나 첫 번째 사용 가능한 워크스페이스 사용
        if (workspacesData?.workspace?.length > 0) {
          const defaultWorkspace = workspacesData.workspace.find(w => w.name === 'Default Workspace') || workspacesData.workspace[0]
          workspaceId = defaultWorkspace.workspaceId
        }
      }

      const [containerRes, tagsRes, triggersRes, variablesRes] = await Promise.all([
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }),
        fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/variables`, { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } })
      ])

      const containerData = containerRes.ok ? await containerRes.json() : null
      const tagsData = tagsRes.ok ? await tagsRes.json() : { tag: [] }
      const triggersData = triggersRes.ok ? await triggersRes.json() : { trigger: [] }
      const variablesData = variablesRes.ok ? await variablesRes.json() : { variable: [] }

      // 데이터 로드 성공 로그
      if (containerData && (tagsData?.tag?.length > 0 || triggersData?.trigger?.length > 0)) {
        console.log(`✅ GTM 실제 데이터 로드: 태그 ${tagsData?.tag?.length || 0}개, 트리거 ${triggersData?.trigger?.length || 0}개, 변수 ${variablesData?.variable?.length || 0}개`)
      }

      const processedData = processGTMData(containerData, tagsData, triggersData, variablesData)

      // 저장된 Goal 설정 로드
      const savedGoals = await prisma.GTMGoal.findMany({
        where: {
          accountId,
          containerId: publicId
        },
        orderBy: {
          priority: 'asc'
        }
      })

      // Goal 설정을 태그에 적용
      const savedGoalIds = new Set(savedGoals.map(goal => goal.tagId))
      processedData.tags = processedData.tags.map((tag: any) => ({
        ...tag,
        isGoal: savedGoalIds.has(tag.id),
        goalPriority: savedGoals.find(goal => goal.tagId === tag.id)?.priority || 0
      }))

      return NextResponse.json({
        success: true,
        containerId: publicId,
        accountId: accountId,
        dataMode,
        data: processedData,
        savedGoals: savedGoals.length,
        message: `✅ ${dataMode === 'realtime' ? '실시간' : 'DB'} GTM 데이터 로드 완료 (태그 ${processedData?.summary?.totalTags || 0}개, Goal ${savedGoals.length}개)`
      })

    } catch (gtmError) {
      console.error('GTM API 호출 중 오류 발생:', gtmError)
      return NextResponse.json({
        error: 'GTM API 호출 중 오류가 발생했습니다',
        message: 'GTM 계정 권한이나 컨테이너 설정을 확인해주세요.',
        details: gtmError.message
      }, { status: 500 })
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

    console.log('GTM Goal 저장 요청:', { accountId, containerId, goalsCount: goals?.length })

    if (!accountId || !containerId || !goals) {
      console.error('필수 필드 누락:', { accountId, containerId, goals })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 기존 Goal 설정 삭제
    console.log('기존 Goal 설정 삭제 중...')
    await prisma.GTMGoal.deleteMany({
      where: {
        accountId,
        containerId
      }
    })

    // 새로운 Goal 설정 저장
    const validGoals = goals.filter((goal: any) => goal.tagId)
    console.log(`유효한 Goal ${validGoals.length}개 저장 중...`)
    
    const goalPromises = validGoals.map((goal: any, index: number) => {
      console.log(`Goal 저장: ${goal.name} (${goal.tagId})`)
      return prisma.GTMGoal.create({
        data: {
          accountId,
          containerId,
          tagId: goal.tagId,
          name: goal.name,
          type: goal.type,
          priority: index + 1,
          isActive: true
        }
      })
    })

    await Promise.all(goalPromises)
    console.log('모든 Goal 저장 완료')

    // 저장된 Goal 목록 조회
    const savedGoals = await prisma.GTMGoal.findMany({
      where: {
        accountId,
        containerId
      },
      orderBy: {
        priority: 'asc'
      }
    })

    console.log(`저장된 Goal ${savedGoals.length}개 조회 완료`)

    return NextResponse.json({ 
      success: true, 
      message: `${validGoals.length}개의 GTM Goal이 저장되었습니다.`,
      savedGoals: savedGoals.length,
      goals: savedGoals
    })
  } catch (error: any) {
    console.error('Error saving GTM Goals:', error)
    return NextResponse.json({ 
      error: 'Failed to save GTM Goals', 
      details: error.message 
    }, { status: 500 })
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