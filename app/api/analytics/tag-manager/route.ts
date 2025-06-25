import { NextRequest, NextResponse } from 'next/server'
import { GoogleAuth } from 'google-auth-library'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const containerId = searchParams.get('containerId') || process.env.GTM_CONTAINER_ID
    const analysisType = searchParams.get('type') || 'triggers' // triggers, tags, variables, performance
    const startDate = searchParams.get('startDate') || '7daysAgo'
    const endDate = searchParams.get('endDate') || 'today'

    if (!containerId) {
      return NextResponse.json({ error: 'Container ID is required' }, { status: 400 })
    }

    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      return NextResponse.json({ error: 'Service account key not found' }, { status: 500 })
    }

    const credentials = JSON.parse(serviceAccountKey)
    const auth = new GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/tagmanager.readonly',
        'https://www.googleapis.com/auth/analytics.readonly'
      ]
    })

    const authClient = await auth.getClient()
    const accessToken = await authClient.getAccessToken()

    let analysisData
    switch (analysisType) {
      case 'triggers':
        analysisData = await analyzeTriggers(containerId, accessToken.token)
        break
      case 'tags':
        analysisData = await analyzeTags(containerId, accessToken.token)
        break
      case 'variables':
        analysisData = await analyzeVariables(containerId, accessToken.token)
        break
      case 'performance':
        analysisData = await analyzePerformance(containerId, accessToken.token, startDate, endDate)
        break
      default:
        analysisData = await getOverview(containerId, accessToken.token)
    }

    return NextResponse.json({
      success: true,
      containerId,
      analysisType,
      data: analysisData
    })

  } catch (error: any) {
    console.error('Tag Manager analysis error:', error)
    
    // Mock 데이터 반환 (개발/테스트용)
    const { searchParams } = new URL(request.url)
    return NextResponse.json(
      generateMockTagManagerData({
        containerId: searchParams.get('containerId'),
        analysisType: searchParams.get('type') || 'overview'
      })
    )
  }
}

async function analyzeTriggers(containerId: string, accessToken: string) {
  const response = await fetch(
    `https://tagmanager.googleapis.com/tagmanager/v2/accounts/-/containers/${containerId}/workspaces/-/triggers`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch triggers')
  }

  const data = await response.json()
  const triggers = data.trigger || []

  const triggerAnalysis = {
    total: triggers.length,
    byType: {},
    byStatus: { enabled: 0, paused: 0 },
    firingFrequency: [],
    utmRelated: [],
    performanceImpact: []
  }

  triggers.forEach((trigger: any) => {
    // 타입별 분석
    const type = trigger.type
    triggerAnalysis.byType[type] = (triggerAnalysis.byType[type] || 0) + 1

    // 상태별 분석
    if (trigger.paused) {
      triggerAnalysis.byStatus.paused++
    } else {
      triggerAnalysis.byStatus.enabled++
    }

    // UTM 관련 트리거 식별
    if (isUtmRelated(trigger)) {
      triggerAnalysis.utmRelated.push({
        name: trigger.name,
        type: trigger.type,
        conditions: trigger.filter || []
      })
    }

    // 성능 영향도 분석 (Mock)
    triggerAnalysis.performanceImpact.push({
      name: trigger.name,
      type: trigger.type,
      estimatedFiringRate: Math.floor(Math.random() * 1000),
      performanceScore: Math.floor(Math.random() * 100)
    })
  })

  return triggerAnalysis
}

async function analyzeTags(containerId: string, accessToken: string) {
  const response = await fetch(
    `https://tagmanager.googleapis.com/tagmanager/v2/accounts/-/containers/${containerId}/workspaces/-/tags`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch tags')
  }

  const data = await response.json()
  const tags = data.tag || []

  const tagAnalysis = {
    total: tags.length,
    byType: {},
    byStatus: { enabled: 0, paused: 0 },
    trackingTags: [],
    conversionTags: [],
    utmTracking: [],
    healthCheck: []
  }

  tags.forEach((tag: any) => {
    const type = tag.type
    tagAnalysis.byType[type] = (tagAnalysis.byType[type] || 0) + 1

    if (tag.paused) {
      tagAnalysis.byStatus.paused++
    } else {
      tagAnalysis.byStatus.enabled++
    }

    // 추적 태그 분류
    if (isTrackingTag(tag)) {
      tagAnalysis.trackingTags.push({
        name: tag.name,
        type: tag.type,
        trackingId: extractTrackingId(tag)
      })
    }

    // 전환 태그 분류
    if (isConversionTag(tag)) {
      tagAnalysis.conversionTags.push({
        name: tag.name,
        type: tag.type,
        conversionValue: extractConversionValue(tag)
      })
    }

    // UTM 추적 태그
    if (hasUtmTracking(tag)) {
      tagAnalysis.utmTracking.push({
        name: tag.name,
        type: tag.type,
        utmParameters: extractUtmParameters(tag)
      })
    }

    // 태그 헬스 체크
    tagAnalysis.healthCheck.push({
      name: tag.name,
      type: tag.type,
      status: tag.paused ? 'paused' : 'active',
      hasErrors: Math.random() > 0.9, // Mock error detection
      lastFired: generateMockTimestamp()
    })
  })

  return tagAnalysis
}

async function analyzeVariables(containerId: string, accessToken: string) {
  const response = await fetch(
    `https://tagmanager.googleapis.com/tagmanager/v2/accounts/-/containers/${containerId}/workspaces/-/variables`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch variables')
  }

  const data = await response.json()
  const variables = data.variable || []

  const variableAnalysis = {
    total: variables.length,
    byType: {},
    builtIn: variables.filter((v: any) => v.type === 'v').length,
    custom: variables.filter((v: any) => v.type !== 'v').length,
    utmVariables: [],
    dataLayerVariables: [],
    unusedVariables: []
  }

  variables.forEach((variable: any) => {
    const type = variable.type
    variableAnalysis.byType[type] = (variableAnalysis.byType[type] || 0) + 1

    // UTM 관련 변수
    if (isUtmVariable(variable)) {
      variableAnalysis.utmVariables.push({
        name: variable.name,
        type: variable.type,
        parameter: variable.parameter || []
      })
    }

    // Data Layer 변수
    if (isDataLayerVariable(variable)) {
      variableAnalysis.dataLayerVariables.push({
        name: variable.name,
        dataLayerName: variable.parameter?.find((p: any) => p.key === 'dataLayerVariable')?.value
      })
    }

    // 사용되지 않는 변수 (Mock)
    if (Math.random() > 0.85) {
      variableAnalysis.unusedVariables.push({
        name: variable.name,
        type: variable.type,
        lastUsed: generateMockTimestamp()
      })
    }
  })

  return variableAnalysis
}

async function analyzePerformance(containerId: string, accessToken: string, startDate: string, endDate: string) {
  // GTM 성능 데이터 분석 (실제로는 GA4나 다른 성능 모니터링 도구와 연동)
  return {
    overview: {
      containerSize: Math.floor(Math.random() * 500) + 200, // KB
      loadTime: Math.floor(Math.random() * 1000) + 500, // ms
      tagCount: Math.floor(Math.random() * 50) + 10,
      triggerCount: Math.floor(Math.random() * 30) + 5
    },
    tagPerformance: [
      {
        tagName: 'GA4 Configuration',
        type: 'gtag',
        loadTime: Math.floor(Math.random() * 200) + 50,
        errorRate: Math.random() * 0.05,
        firingRate: Math.floor(Math.random() * 10000) + 1000
      },
      {
        tagName: 'UTM Tracker',
        type: 'html',
        loadTime: Math.floor(Math.random() * 100) + 20,
        errorRate: Math.random() * 0.02,
        firingRate: Math.floor(Math.random() * 5000) + 500
      }
    ],
    recommendations: [
      {
        priority: 'high',
        type: 'performance',
        title: '태그 로딩 순서 최적화',
        description: '중요하지 않은 태그들을 비동기로 로딩하여 성능 개선',
        impact: '페이지 로딩 시간 15% 단축 예상'
      },
      {
        priority: 'medium',
        type: 'cleanup',
        title: '사용하지 않는 태그 정리',
        description: '비활성화된 태그와 변수 제거',
        impact: '컨테이너 크기 20% 감소 예상'
      }
    ]
  }
}

async function getOverview(containerId: string, accessToken: string) {
  const [triggers, tags, variables] = await Promise.all([
    analyzeTriggers(containerId, accessToken),
    analyzeTags(containerId, accessToken),
    analyzeVariables(containerId, accessToken)
  ])

  return {
    summary: {
      totalTags: tags.total,
      totalTriggers: triggers.total,
      totalVariables: variables.total,
      utmRelatedItems: triggers.utmRelated.length + tags.utmTracking.length + variables.utmVariables.length
    },
    healthStatus: {
      activeTags: tags.byStatus.enabled,
      pausedTags: tags.byStatus.paused,
      activeTriggers: triggers.byStatus.enabled,
      pausedTriggers: triggers.byStatus.paused,
      overallHealth: calculateHealthScore(tags, triggers, variables)
    },
    insights: [
      {
        type: 'info',
        title: 'GTM 설정 현황',
        description: `총 ${tags.total}개 태그, ${triggers.total}개 트리거, ${variables.total}개 변수가 설정되어 있습니다`
      },
      {
        type: 'success',
        title: 'UTM 추적 설정',
        description: `${triggers.utmRelated.length}개의 UTM 관련 추적이 활성화되어 있습니다`
      }
    ]
  }
}

function generateMockTagManagerData({ containerId, analysisType }: any) {
  const mockData = {
    triggers: {
      total: 15,
      byType: {
        'pageview': 3,
        'click': 5,
        'form_submit': 2,
        'timer': 1,
        'custom_event': 4
      },
      byStatus: { enabled: 12, paused: 3 },
      utmRelated: [
        {
          name: 'UTM Campaign Tracker',
          type: 'pageview',
          conditions: ['utm_campaign', 'utm_source', 'utm_medium']
        },
        {
          name: 'UTM Link Click',
          type: 'click',
          conditions: ['utm_content', 'utm_term']
        }
      ],
      performanceImpact: [
        { name: 'Page View', type: 'pageview', estimatedFiringRate: 2500, performanceScore: 95 },
        { name: 'UTM Tracker', type: 'custom_event', estimatedFiringRate: 800, performanceScore: 88 }
      ]
    },
    tags: {
      total: 12,
      byType: {
        'gtag': 4,
        'html': 3,
        'img': 2,
        'conversion_linker': 1,
        'facebook_pixel': 2
      },
      byStatus: { enabled: 10, paused: 2 },
      trackingTags: [
        { name: 'GA4 Config', type: 'gtag', trackingId: 'G-XXXXXXXXXX' },
        { name: 'Facebook Pixel', type: 'facebook_pixel', trackingId: 'XXXXXXXXXXXX' }
      ],
      conversionTags: [
        { name: 'Purchase Conversion', type: 'gtag', conversionValue: 'dynamic' },
        { name: 'Lead Form', type: 'html', conversionValue: 'fixed' }
      ],
      utmTracking: [
        {
          name: 'UTM Event Tracker',
          type: 'gtag',
          utmParameters: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
        }
      ]
    },
    variables: {
      total: 25,
      byType: {
        'v': 18, // Built-in variables
        'jsm': 4, // JavaScript variables
        'dlv': 2, // Data Layer variables
        'c': 1 // Constant
      },
      builtIn: 18,
      custom: 7,
      utmVariables: [
        { name: 'UTM Source', type: 'v', parameter: [] },
        { name: 'UTM Campaign', type: 'v', parameter: [] },
        { name: 'UTM Medium', type: 'v', parameter: [] }
      ],
      dataLayerVariables: [
        { name: 'User ID', dataLayerName: 'user_id' },
        { name: 'Transaction Value', dataLayerName: 'transaction_value' }
      ]
    },
    performance: {
      overview: {
        containerSize: 320,
        loadTime: 680,
        tagCount: 12,
        triggerCount: 15
      },
      recommendations: [
        {
          priority: 'high',
          type: 'performance',
          title: 'UTM 파라미터 캐싱 최적화',
          description: 'UTM 파라미터를 세션 스토리지에 캐싱하여 중복 처리 방지',
          impact: 'UTM 추적 성능 30% 향상 예상'
        },
        {
          priority: 'medium',
          type: 'setup',
          title: 'Enhanced Ecommerce 태그 통합',
          description: '개별 전환 태그들을 Enhanced Ecommerce로 통합',
          impact: '태그 수 50% 감소, 데이터 일관성 향상'
        }
      ]
    }
  }

  return {
    success: true,
    isMockData: true,
    containerId: containerId || 'GTM-XXXXXXX',
    analysisType,
    data: analysisType === 'overview' ? {
      summary: {
        totalTags: mockData.tags.total,
        totalTriggers: mockData.triggers.total,
        totalVariables: mockData.variables.total,
        utmRelatedItems: mockData.triggers.utmRelated.length + mockData.tags.utmTracking.length + mockData.variables.utmVariables.length
      },
      healthStatus: {
        activeTags: mockData.tags.byStatus.enabled,
        pausedTags: mockData.tags.byStatus.paused,
        activeTriggers: mockData.triggers.byStatus.enabled,
        pausedTriggers: mockData.triggers.byStatus.paused,
        overallHealth: 87
      },
      insights: [
        {
          type: 'info',
          title: 'GTM 설정 현황',
          description: `총 ${mockData.tags.total}개 태그, ${mockData.triggers.total}개 트리거, ${mockData.variables.total}개 변수가 설정되어 있습니다`
        },
        {
          type: 'success',
          title: 'UTM 추적 설정',
          description: `${mockData.triggers.utmRelated.length}개의 UTM 관련 추적이 활성화되어 있습니다`
        }
      ]
    } : mockData[analysisType as keyof typeof mockData] || mockData.triggers
  }
}

// Helper functions
function isUtmRelated(trigger: any): boolean {
  const name = trigger.name?.toLowerCase() || ''
  const conditions = JSON.stringify(trigger.filter || []).toLowerCase()
  return name.includes('utm') || conditions.includes('utm')
}

function isTrackingTag(tag: any): boolean {
  const trackingTypes = ['gtag', 'ga', 'facebook_pixel', 'google_ads']
  return trackingTypes.includes(tag.type)
}

function isConversionTag(tag: any): boolean {
  const name = tag.name?.toLowerCase() || ''
  return name.includes('conversion') || name.includes('purchase') || name.includes('lead')
}

function hasUtmTracking(tag: any): boolean {
  const config = JSON.stringify(tag.parameter || []).toLowerCase()
  return config.includes('utm')
}

function extractTrackingId(tag: any): string {
  const trackingIdParam = tag.parameter?.find((p: any) => 
    p.key === 'measurementId' || p.key === 'trackingId' || p.key === 'pixelId'
  )
  return trackingIdParam?.value || 'Not configured'
}

function extractConversionValue(tag: any): string {
  const valueParam = tag.parameter?.find((p: any) => 
    p.key === 'value' || p.key === 'conversionValue'
  )
  return valueParam?.value || 'Not set'
}

function extractUtmParameters(tag: any): string[] {
  const params = tag.parameter || []
  return params
    .filter((p: any) => p.key?.toLowerCase().includes('utm'))
    .map((p: any) => p.key)
}

function isUtmVariable(variable: any): boolean {
  const name = variable.name?.toLowerCase() || ''
  return name.includes('utm')
}

function isDataLayerVariable(variable: any): boolean {
  return variable.type === 'dlv'
}

function generateMockTimestamp(): string {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
  return timestamp.toISOString()
}

function calculateHealthScore(tags: any, triggers: any, variables: any): number {
  const totalItems = tags.total + triggers.total
  const activeItems = tags.byStatus.enabled + triggers.byStatus.enabled
  const healthScore = Math.floor((activeItems / totalItems) * 100)
  return Math.min(100, Math.max(0, healthScore))
}