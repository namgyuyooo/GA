import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// GA4 클라이언트 초기화
function getAnalyticsClient() {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'secrets', 'service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    const jwt = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    return new BetaAnalyticsDataClient({ authClient: jwt });
  } catch (error) {
    console.error('Error initializing GA4 client:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const propertyId = searchParams.get('propertyId') || '464147982';
    
    // 기간 계산
    const now = new Date();
    let startDate: string;
    
    switch (period) {
      case '7d':
        startDate = '7daysAgo';
        break;
      case '30d':
        startDate = '30daysAgo';
        break;
      case '90d':
        startDate = '90daysAgo';
        break;
      default:
        startDate = '7daysAgo';
    }

    const analyticsClient = getAnalyticsClient();
    if (!analyticsClient) {
      return NextResponse.json(
        { error: 'Failed to initialize GA4 client' },
        { status: 500 }
      );
    }

    // 1. 페이지 전환 데이터 (페이지 경로별 세션)
    const pageTransitionsData = await fetchPageTransitions(analyticsClient, propertyId, startDate);
    
    // 2. 체류 시간 데이터
    const dwellTimeData = await fetchDwellTime(analyticsClient, propertyId, startDate);
    
    // 3. 스크롤 깊이 데이터
    const scrollDepthData = await fetchScrollDepth(analyticsClient, propertyId, startDate);
    
    // 4. 재방문율 데이터
    const revisitRateData = await fetchRevisitRate(analyticsClient, propertyId, startDate);
    
    // 5. 관심도 지표 (이벤트 기반)
    const interestMetricsData = await fetchInterestMetrics(analyticsClient, propertyId, startDate);
    
    // 6. 사용자 행동 패턴
    const behaviorPatternsData = await fetchBehaviorPatterns(analyticsClient, propertyId, startDate);
    
    // 7. 시간대별 분석
    const timeOfDayData = await fetchTimeOfDayAnalysis(analyticsClient, propertyId, startDate);
    
    // 8. 디바이스별 분석
    const deviceAnalysisData = await fetchDeviceAnalysis(analyticsClient, propertyId, startDate);

    // 9. 유입 경로 분석
    const entryPathData = await fetchEntryPathAnalysis(analyticsClient, propertyId, startDate);
    
    // 10. 이탈 페이지 및 전환 목표 분석
    const exitGoalData = await fetchExitGoalAnalysis(analyticsClient, propertyId, startDate);

    const result = {
      pageTransitions: pageTransitionsData,
      dwellTime: dwellTimeData,
      scrollDepth: scrollDepthData,
      revisitRate: revisitRateData,
      interestMetrics: interestMetricsData,
      userBehaviorPatterns: behaviorPatternsData,
      timeOfDayAnalysis: timeOfDayData,
      deviceAnalysis: deviceAnalysisData,
      entryPathAnalysis: entryPathData,
      exitGoalAnalysis: exitGoalData
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user journey data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user journey data' },
      { status: 500 }
    );
  }
}

// 페이지 전환 데이터 가져오기
async function fetchPageTransitions(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'nextPagePath' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'eventCount' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'nextPagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: '/'
          }
        }
      },
      limit: 100
    });

    const transitions: any[] = [];
    const transitionMap = new Map<string, number>();

    response.rows?.forEach((row) => {
      const from = row.dimensionValues?.[0]?.value || '';
      const to = row.dimensionValues?.[1]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');

      if (from && to && from !== to) {
        const key = `${from}→${to}`;
        transitionMap.set(key, (transitionMap.get(key) || 0) + sessions);
      }
    });

    // 상위 전환 경로만 반환
    return Array.from(transitionMap.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

  } catch (error) {
    console.error('Error fetching page transitions:', error);
    return [];
  }
}

// 체류 시간 데이터 가져오기
async function fetchDwellTime(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'averageSessionDuration' },
        { name: 'sessions' },
        { name: 'screenPageViews' }
      ],
      limit: 50
    });

    return response.rows?.map((row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const avgTime = parseFloat(row.metricValues?.[0]?.value || '0') / 1000; // 초 단위로 변환
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');
      
      return {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        avgTime: Math.round(avgTime * 10) / 10,
        sessions
      };
    }).filter(item => item.sessions > 0) || [];

  } catch (error) {
    console.error('Error fetching dwell time:', error);
    return [];
  }
}

// 스크롤 깊이 데이터 가져오기 (이벤트 기반)
async function fetchScrollDepth(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'sessions' }
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: 'scroll'
                }
              }
            }
          ]
        }
      },
      limit: 100
    });

    const scrollMap = new Map<string, { count: number; sessions: number }>();

    response.rows?.forEach((row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const eventName = row.dimensionValues?.[1]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');

      if (page && eventName.includes('scroll')) {
        const existing = scrollMap.get(page) || { count: 0, sessions: 0 };
        scrollMap.set(page, {
          count: existing.count + count,
          sessions: Math.max(existing.sessions, sessions)
        });
      }
    });

    return Array.from(scrollMap.entries())
      .map(([page, data]) => ({
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        avgDepth: Math.min(100, Math.round((data.count / data.sessions) * 10)),
        sessions: data.sessions
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

  } catch (error) {
    console.error('Error fetching scroll depth:', error);
    return [];
  }
}

// 재방문율 데이터 가져오기
async function fetchRevisitRate(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' }
      ],
      limit: 50
    });

    return response.rows?.map((row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const totalUsers = parseInt(row.metricValues?.[1]?.value || '0');
      const newUsers = parseInt(row.metricValues?.[2]?.value || '0');
      
      const returningUsers = totalUsers - newUsers;
      const revisitRate = totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0;

      return {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        rate: Math.round(revisitRate * 10) / 10,
        totalVisits: sessions
      };
    }).filter(item => item.totalVisits > 0) || [];

  } catch (error) {
    console.error('Error fetching revisit rate:', error);
    return [];
  }
}

// 관심도 지표 데이터 가져오기 (이벤트 기반)
async function fetchInterestMetrics(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'eventCount' },
        { name: 'sessions' },
        { name: 'totalUsers' }
      ],
      limit: 50
    });

    const eventCategories = {
      'click': '클릭 상호작용',
      'scroll': '스크롤 활동',
      'form': '폼 제출',
      'video': '비디오 시청',
      'download': '다운로드',
      'share': '공유 활동',
      'search': '검색 활동'
    };

    const categoryMap = new Map<string, { engagement: number; conversion: number; count: number }>();

    response.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0');
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');
      const users = parseInt(row.metricValues?.[2]?.value || '0');

      // 이벤트 카테고리 분류
      let category = '기타 활동';
      for (const [key, value] of Object.entries(eventCategories)) {
        if (eventName.toLowerCase().includes(key)) {
          category = value;
          break;
        }
      }

      const existing = categoryMap.get(category) || { engagement: 0, conversion: 0, count: 0 };
      categoryMap.set(category, {
        engagement: existing.engagement + (sessions > 0 ? (count / sessions) * 100 : 0),
        conversion: existing.conversion + (users > 0 ? (count / users) * 100 : 0),
        count: existing.count + count
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        engagement: Math.round(data.engagement * 10) / 10,
        conversion: Math.round(data.conversion * 10) / 10
      }))
      .sort((a, b) => b.engagement - a.engagement);

  } catch (error) {
    console.error('Error fetching interest metrics:', error);
    return [];
  }
}

// 사용자 행동 패턴 분석
async function fetchBehaviorPatterns(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'deviceCategory' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'conversions' }
      ],
      limit: 50
    });

    return response.rows?.map((row) => {
      const channel = row.dimensionValues?.[0]?.value || '';
      const device = row.dimensionValues?.[1]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const engagementRate = parseFloat(row.metricValues?.[1]?.value || '0') * 100;
      const conversions = parseInt(row.metricValues?.[2]?.value || '0');
      
      const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;
      const pattern = `${channel} (${device})`;

      return {
        pattern,
        frequency: sessions,
        avgEngagement: Math.round(engagementRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      };
    }).filter(item => item.frequency > 0) || [];

  } catch (error) {
    console.error('Error fetching behavior patterns:', error);
    return [];
  }
}

// 시간대별 분석
async function fetchTimeOfDayAnalysis(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'hour' }],
      metrics: [
        { name: 'sessions' },
        { name: 'engagementRate' }
      ],
      limit: 24
    });

    return response.rows?.map((row) => {
      const hour = parseInt(row.dimensionValues?.[0]?.value || '0');
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const engagementRate = parseFloat(row.metricValues?.[1]?.value || '0') * 100;

      return {
        hour,
        sessions,
        avgEngagement: Math.round(engagementRate * 10) / 10
      };
    }).sort((a, b) => a.hour - b.hour) || [];

  } catch (error) {
    console.error('Error fetching time of day analysis:', error);
    return [];
  }
}

// 디바이스별 분석
async function fetchDeviceAnalysis(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'conversions' }
      ],
      limit: 10
    });

    return response.rows?.map((row) => {
      const device = row.dimensionValues?.[0]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const avgTime = parseFloat(row.metricValues?.[1]?.value || '0') / 1000; // 초 단위
      const conversions = parseInt(row.metricValues?.[2]?.value || '0');
      
      const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

      return {
        device: device === 'desktop' ? '데스크톱' : device === 'mobile' ? '모바일' : '태블릿',
        sessions,
        avgTime: Math.round(avgTime * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      };
    }).filter(item => item.sessions > 0) || [];

  } catch (error) {
    console.error('Error fetching device analysis:', error);
    return [];
  }
}

// 유입 경로 분석
async function fetchEntryPathAnalysis(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'sessionCampaignName' },
        { name: 'landingPage' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' }
      ],
      limit: 100
    });

    const entryPathMap = new Map<string, {
      channel: string;
      source: string;
      medium: string;
      campaign: string;
      landingPage: string;
      sessions: number;
      users: number;
      engagementRate: number;
      avgDuration: number;
    }>();

    response.rows?.forEach((row) => {
      const channel = row.dimensionValues?.[0]?.value || '';
      const source = row.dimensionValues?.[1]?.value || '';
      const medium = row.dimensionValues?.[2]?.value || '';
      const campaign = row.dimensionValues?.[3]?.value || '';
      const landingPage = row.dimensionValues?.[4]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const users = parseInt(row.metricValues?.[1]?.value || '0');
      const engagementRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100;
      const avgDuration = parseFloat(row.metricValues?.[3]?.value || '0') / 1000;

      const key = `${channel}|${source}|${medium}|${campaign}`;
      const existing = entryPathMap.get(key) || {
        channel,
        source,
        medium,
        campaign,
        landingPage,
        sessions: 0,
        users: 0,
        engagementRate: 0,
        avgDuration: 0
      };

      entryPathMap.set(key, {
        ...existing,
        sessions: existing.sessions + sessions,
        users: existing.users + users,
        engagementRate: Math.max(existing.engagementRate, engagementRate),
        avgDuration: Math.max(existing.avgDuration, avgDuration),
        landingPage: sessions > existing.sessions ? landingPage : existing.landingPage
      });
    });

    return Array.from(entryPathMap.values())
      .map(item => ({
        ...item,
        engagementRate: Math.round(item.engagementRate * 10) / 10,
        avgDuration: Math.round(item.avgDuration * 10) / 10
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 20);

  } catch (error) {
    console.error('Error fetching entry path analysis:', error);
    return [];
  }
}

// 이탈 페이지 및 전환 목표 분석
async function fetchExitGoalAnalysis(client: BetaAnalyticsDataClient, propertyId: string, startDate: string) {
  try {
    // 이탈 페이지 분석
    const [exitResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'exits' },
        { name: 'exitRate' }
      ],
      limit: 50
    });

    // 전환 목표 분석
    const [conversionResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'sessions' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'conversion'
          }
        }
      },
      limit: 100
    });

    // 이탈 페이지 데이터
    const exitPages = exitResponse.rows?.map((row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const exits = parseInt(row.metricValues?.[1]?.value || '0');
      const exitRate = parseFloat(row.metricValues?.[2]?.value || '0') * 100;

      return {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        sessions,
        exits,
        exitRate: Math.round(exitRate * 10) / 10
      };
    }).filter(item => item.sessions > 0) || [];

    // 전환 목표 데이터
    const conversionMap = new Map<string, { page: string; conversions: number; sessions: number }>();
    
    conversionResponse.rows?.forEach((row) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const eventName = row.dimensionValues?.[1]?.value || '';
      const conversions = parseInt(row.metricValues?.[0]?.value || '0');
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');

      const key = page;
      const existing = conversionMap.get(key) || { page, conversions: 0, sessions: 0 };
      conversionMap.set(key, {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        conversions: existing.conversions + conversions,
        sessions: Math.max(existing.sessions, sessions)
      });
    });

    const conversionPages = Array.from(conversionMap.values())
      .map(item => ({
        ...item,
        conversionRate: item.sessions > 0 ? (item.conversions / item.sessions) * 100 : 0
      }))
      .map(item => ({
        ...item,
        conversionRate: Math.round(item.conversionRate * 10) / 10
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 20);

    return {
      exitPages,
      conversionPages
    };

  } catch (error) {
    console.error('Error fetching exit goal analysis:', error);
    return { exitPages: [], conversionPages: [] };
  }
} 