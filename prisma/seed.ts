import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 생성 시작...')

  // 1. UTM 캠페인 데이터
  console.log('📌 UTM 캠페인 생성 중...')
  const utmCampaigns = await Promise.all([
    prisma.utmCampaign.upsert({
      where: { id: 'utm-1' },
      update: {},
      create: {
        id: 'utm-1',
        name: 'RTM AI 런칭 캠페인',
        url: 'https://rtm.ai?utm_source=google&utm_medium=cpc&utm_campaign=rtm-ai-launch',
        source: 'google',
        medium: 'cpc',
        campaign: 'rtm-ai-launch',
        description: 'RTM AI 서비스 공식 런칭 캠페인',
        status: 'ACTIVE',
      }
    }),
    prisma.utmCampaign.upsert({
      where: { id: 'utm-2' },
      update: {},
      create: {
        id: 'utm-2',
        name: '네이버 블로그 마케팅',
        url: 'https://rtm.ai?utm_source=naver&utm_medium=blog&utm_campaign=content-marketing',
        source: 'naver',
        medium: 'blog',
        campaign: 'content-marketing',
        description: '네이버 블로그를 통한 콘텐츠 마케팅',
        status: 'ACTIVE',
      }
    }),
    prisma.utmCampaign.upsert({
      where: { id: 'utm-3' },
      update: {},
      create: {
        id: 'utm-3',
        name: '페이스북 소셜 광고',
        url: 'https://rtm.ai?utm_source=facebook&utm_medium=social&utm_campaign=fb-ads-q4',
        source: 'facebook',
        medium: 'social',
        campaign: 'fb-ads-q4',
        description: '4분기 페이스북 소셜 미디어 광고',
        status: 'ACTIVE',
      }
    })
  ])

  // 2. 전환 목표 설정
  console.log('🎯 전환 목표 생성 중...')
  const conversionGoals = await Promise.all([
    prisma.conversionGoal.upsert({
      where: { id: 'goal-1' },
      update: {},
      create: {
        id: 'goal-1',
        name: '회원가입 완료',
        description: '사용자가 회원가입을 완료한 경우',
        goalType: 'PAGE_VIEW',
        pagePath: '/signup/complete',
        isActive: true,
        priority: 1,
        propertyId: '464147982',
      }
    }),
    prisma.conversionGoal.upsert({
      where: { id: 'goal-2' },
      update: {},
      create: {
        id: 'goal-2',
        name: '서비스 구독',
        description: '유료 서비스 구독 완료',
        goalType: 'EVENT',
        eventName: 'purchase',
        isActive: true,
        priority: 1,
        propertyId: '464147982',
      }
    }),
    prisma.conversionGoal.upsert({
      where: { id: 'goal-3' },
      update: {},
      create: {
        id: 'goal-3',
        name: '문의하기',
        description: '고객 문의 양식 제출',
        goalType: 'EVENT',
        eventName: 'contact_submit',
        isActive: true,
        priority: 2,
        propertyId: '464147982',
      }
    })
  ])

  // 3. GTM 목표 설정
  console.log('🏷️ GTM 목표 생성 중...')
  const gtmGoals = await Promise.all([
    prisma.gTMGoal.upsert({
      where: { 
        accountId_containerId_tagId: {
          accountId: '6000000000',
          containerId: 'GTM-N99ZMP6T',
          tagId: 'GT-001'
        }
      },
      update: {},
      create: {
        accountId: '6000000000',
        containerId: 'GTM-N99ZMP6T',
        tagId: 'GT-001',
        name: 'GA4 구성 태그',
        type: 'gtagconfig',
        isActive: true,
        priority: 1,
      }
    }),
    prisma.gTMGoal.upsert({
      where: { 
        accountId_containerId_tagId: {
          accountId: '6000000000',
          containerId: 'GTM-N99ZMP6T',
          tagId: 'GT-002'
        }
      },
      update: {},
      create: {
        accountId: '6000000000',
        containerId: 'GTM-N99ZMP6T',
        tagId: 'GT-002',
        name: '회원가입 이벤트',
        type: 'gaEvent',
        isActive: true,
        priority: 2,
      }
    })
  ])

  // 4. 프롬프트 템플릿
  console.log('📝 프롬프트 템플릿 생성 중...')
  const promptTemplates = await Promise.all([
    prisma.promptTemplate.upsert({
      where: { id: 'template-1' },
      update: {},
      create: {
        id: 'template-1',
        name: '트래픽 분석 기본 템플릿',
        type: 'traffic-insight',
        prompt: `다음은 {{dateRange}} 기간의 트래픽 소스 분석 데이터입니다.

주요 지표:
- 총 세션: {{totalSessions}}
- 등록된 UTM 캠페인: {{utmCampaigns}}개
- 자연 유입: {{organicTraffic}}

위 데이터를 바탕으로 다음 내용을 분석해주세요:
1. 가장 성과가 좋은 트래픽 소스 3가지
2. UTM 캠페인의 효과성 평가
3. 개선이 필요한 영역 2가지 제안`,
        variables: ['dateRange', 'totalSessions', 'utmCampaigns', 'organicTraffic'],
        isDefault: true,
        isActive: true,
      }
    }),
    prisma.promptTemplate.upsert({
      where: { id: 'template-2' },
      update: {},
      create: {
        id: 'template-2',
        name: '대시보드 종합 분석 템플릿',
        type: 'dashboard-insight',
        prompt: `{{dateRange}} 기간의 종합 분석 리포트:

핵심 지표:
- 페이지뷰: {{pageviews}}
- 세션: {{sessions}}  
- 사용자: {{users}}
- 전환율: {{conversionRate}}%

성과 분석:
1. 전월 대비 성장률 분석
2. 주요 전환 경로 효과성
3. 개선 기회 및 액션 아이템 제안`,
        variables: ['dateRange', 'pageviews', 'sessions', 'users', 'conversionRate'],
        isDefault: false,
        isActive: true,
      }
    })
  ])

  // 5. 경쟁사 데이터
  console.log('🏢 경쟁사 데이터 생성 중...')
  const competitors = await Promise.all([
    prisma.competitor.upsert({
      where: { domain: 'naver.com' },
      update: {},
      create: {
        name: '네이버',
        domain: 'naver.com',
        description: '국내 대표 포털 사이트',
        industry: '포털/검색',
        keywords: ['검색', '포털', '뉴스', '쇼핑', '지도'],
        isActive: true,
      }
    }),
    prisma.competitor.upsert({
      where: { domain: 'google.com' },
      update: {},
      create: {
        name: '구글',
        domain: 'google.com',
        description: '글로벌 검색 엔진',
        industry: '검색/기술',
        keywords: ['search', 'AI', 'cloud', 'analytics'],
        isActive: true,
      }
    }),
    prisma.competitor.upsert({
      where: { domain: 'openai.com' },
      update: {},
      create: {
        name: 'OpenAI',
        domain: 'openai.com',
        description: 'AI 연구 및 개발 회사',
        industry: 'AI/기술',
        keywords: ['AI', 'ChatGPT', 'GPT', 'machine learning'],
        isActive: true,
      }
    })
  ])

  // 6. 통합 이벤트 시퀀스 샘플 데이터
  console.log('📊 통합 이벤트 시퀀스 생성 중...')
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  const eventSequences = await Promise.all([
    prisma.unifiedEventSequence.create({
      data: {
        sessionId: 'session_001',
        userId: 'user_001',
        propertyId: '464147982',
        timestamp: yesterday,
        eventType: 'page_view',
        eventData: {
          pagePath: '/',
          pageTitle: 'RTM AI - 홈페이지',
          pageViews: 1245,
          users: 892,
          avgTimeOnPage: '00:02:34',
          bounceRate: 0.45,
          topSource: 'organic'
        }
      }
    }),
    prisma.unifiedEventSequence.create({
      data: {
        sessionId: 'session_002',
        propertyId: '464147982',
        timestamp: yesterday,
        eventType: 'traffic_source',
        eventData: {
          source: 'google',
          medium: 'cpc',
          campaign: 'rtm-ai-launch',
          sessions: 423,
          users: 387,
          pageViews: 1245,
          avgSessionDuration: 142.5,
          bounceRate: 0.34,
          conversions: 23,
          revenue: 2450000,
          isRegisteredUTM: true,
          category: 'utm'
        }
      }
    }),
    prisma.unifiedEventSequence.create({
      data: {
        sessionId: 'session_003',
        propertyId: '464147982',
        timestamp: yesterday,
        eventType: 'search_inflow',
        eventData: {
          keyword: 'AI 분석 도구',
          source: 'google',
          sessions: 156,
          users: 134,
          conversions: 8
        }
      }
    }),
    prisma.unifiedEventSequence.create({
      data: {
        sessionId: 'session_004',
        propertyId: '464147982',
        timestamp: now,
        eventType: 'conversion',
        eventData: {
          goalName: '회원가입 완료',
          goalType: 'destination',
          conversionValue: 50000,
          sessionDuration: 245,
          pageSequence: [
            { page: '/', timestamp: now.toISOString(), duration: 45 },
            { page: '/signup', timestamp: now.toISOString(), duration: 120 },
            { page: '/signup/complete', timestamp: now.toISOString(), duration: 80 }
          ]
        }
      }
    })
  ])

  // 7. 캐시된 분석 데이터
  console.log('💾 캐시된 분석 데이터 생성 중...')
  const cachedData = await Promise.all([
    prisma.cachedAnalyticsData.upsert({
      where: {
        propertyId_dataType_period: {
          propertyId: '464147982',
          dataType: 'overview',
          period: '7daysAgo'
        }
      },
      update: {},
      create: {
        propertyId: '464147982',
        dataType: 'overview',
        period: '7daysAgo',
        data: {
          totalUsers: 2534,
          totalSessions: 3421,
          totalPageViews: 8765,
          avgSessionDuration: 156.7,
          bounceRate: 0.42,
          conversionRate: 0.067,
          topPages: [
            { page: '/', pageViews: 3245, users: 2134 },
            { page: '/services', pageViews: 1876, users: 1234 },
            { page: '/about', pageViews: 987, users: 654 }
          ],
          topSources: [
            { source: 'google', medium: 'organic', sessions: 1234 },
            { source: 'direct', medium: 'none', sessions: 987 },
            { source: 'facebook', medium: 'social', sessions: 456 }
          ]
        },
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2시간 후 만료
      }
    })
  ])

  // 8. AI 인사이트 샘플
  console.log('🤖 AI 인사이트 생성 중...')
  const insights = await Promise.all([
    prisma.insight.upsert({
      where: { id: 'insight-1' },
      update: {},
      create: {
        id: 'insight-1',
        type: 'traffic',
        propertyId: '464147982',
        model: 'gemini-1.5-flash',
        prompt: '트래픽 소스 분석 및 개선 제안',
        result: `## 📊 트래픽 분석 결과

### 🎯 주요 성과
1. **Google CPC 캠페인** 성과 우수: 전환율 5.4%로 목표 대비 120% 달성
2. **자연 검색 유입** 안정적: 전체 트래픽의 36% 차지
3. **소셜 미디어** 참여도 증가: 페이스북 유입 전월 대비 23% 상승

### 💡 개선 제안
1. **네이버 블로그 마케팅** 강화 필요: 현재 전환율 2.1%로 개선 여지 있음
2. **모바일 최적화** 우선 적용: 모바일 이탈률 56%로 높은 편`,
        dataSourceTypes: ['ga4', 'utm'],
        analysisStartDate: yesterday,
        analysisEndDate: now,
        isComprehensive: false,
      }
    }),
    prisma.insight.upsert({
      where: { id: 'insight-2' },
      update: {},
      create: {
        id: 'insight-2',
        type: 'dashboard',
        propertyId: '464147982',
        model: 'gemini-1.5-pro',
        prompt: '종합 대시보드 분석',
        result: `## 📈 종합 성과 리포트

### 📊 핵심 지표 요약
- **방문자 수**: 2,534명 (전월 대비 +12%)
- **페이지뷰**: 8,765건 (전월 대비 +8%)
- **평균 체류시간**: 2분 36초 (+15초 증가)
- **전환율**: 6.7% (목표 달성)

### 🏆 성공 요인
1. RTM AI 런칭 캠페인의 높은 관심도
2. 콘텐츠 품질 개선으로 체류시간 증가
3. 전환 퍼널 최적화 효과

### 🎯 다음 단계 액션
1. 고성과 키워드 기반 콘텐츠 확장
2. 모바일 UX 개선 프로젝트 시작
3. 리타겟팅 캠페인 설정`,
        dataSourceTypes: ['ga4', 'gtm', 'gsc'],
        analysisStartDate: yesterday,
        analysisEndDate: now,
        isComprehensive: true,
        weeklyTrend: {
          week1: { sessions: 800, conversion: 0.065 },
          week2: { sessions: 820, conversion: 0.067 },
          week3: { sessions: 890, conversion: 0.069 },
          week4: { sessions: 911, conversion: 0.067 }
        }
      }
    })
  ])

  // 9. 사용자 행동 패턴
  console.log('👤 사용자 행동 패턴 생성 중...')
  const userBehaviors = await Promise.all([
    prisma.userBehaviorPattern.upsert({
      where: { id: 'behavior-1' },
      update: {},
      create: {
        id: 'behavior-1',
        propertyId: '464147982',
        patternDate: yesterday,
        patternType: 'GOAL_CONVERSION',
        segmentName: 'High Converting Users',
        entryPatterns: {
          sources: ['google', 'direct', 'facebook'],
          topKeywords: ['AI 도구', 'RTM AI', '분석 서비스']
        },
        entryPagePatterns: {
          topPages: ['/', '/services', '/blog']
        },
        journeyPatterns: {
          commonPaths: [
            { path: '/ → /services → /signup', frequency: 234, conversionRate: 0.78 },
            { path: '/ → /about → /contact', frequency: 156, conversionRate: 0.45 },
            { path: '/blog → /services → /signup', frequency: 89, conversionRate: 0.82 }
          ],
          avgPathLength: 3.2
        },
        durationPatterns: {
          avgSessionDuration: 156,
          avgPageDuration: 45
        },
        scrollPatterns: {
          avgScrollDepth: 0.75
        },
        conversionPatterns: {
          topConvertingPages: ['/services', '/signup']
        },
        dropoffPatterns: {
          dropoffPoints: ['/pricing', '/terms']
        },
        sessionCount: 234,
        conversionRate: 0.78,
        avgInterestScore: 8.5,
        avgDuration: 156,
        insights: {
          keyFindings: [
            '서비스 페이지를 거친 경로의 전환율이 높음',
            '가격 페이지에서 이탈률이 높아 개선 필요',
            '블로그 유입 사용자의 전환 품질이 우수함'
          ]
        },
        recommendations: {
          actions: [
            '가격 페이지 UI/UX 개선',
            '블로그 콘텐츠 마케팅 확대',
            '서비스 소개 페이지 CTA 최적화'
          ]
        }
      }
    })
  ])

  // 10. 설정 데이터
  console.log('⚙️ 설정 데이터 생성 중...')
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: 'GTM_ACCOUNT_ID' },
      update: {},
      create: {
        key: 'GTM_ACCOUNT_ID',
        value: '6000000000'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'GTM_PUBLIC_ID' },
      update: {},
      create: {
        key: 'GTM_PUBLIC_ID',
        value: 'GTM-N99ZMP6T'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'DEFAULT_PROPERTY_ID' },
      update: {},
      create: {
        key: 'DEFAULT_PROPERTY_ID',
        value: '464147982'
      }
    })
  ])

  console.log('✅ 시드 데이터 생성 완료!')
  console.log(`
📊 생성된 데이터:
- UTM 캠페인: ${utmCampaigns.length}개
- 전환 목표: ${conversionGoals.length}개  
- GTM 목표: ${gtmGoals.length}개
- 프롬프트 템플릿: ${promptTemplates.length}개
- 경쟁사: ${competitors.length}개
- 이벤트 시퀀스: ${eventSequences.length}개
- 캐시된 데이터: ${cachedData.length}개
- AI 인사이트: ${insights.length}개
- 행동 패턴: ${userBehaviors.length}개
- 설정: ${settings.length}개
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })