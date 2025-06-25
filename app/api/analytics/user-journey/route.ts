import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// GA4 API 인증 및 클라이언트 초기화
async function getAnalyticsClient() {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'secrets', 'ga-auto-464002-672370fda082.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // JWT 토큰으로 Google API 인증
    const jwt = require('jsonwebtoken');
    
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    const token = jwt.sign(tokenPayload, serviceAccount.private_key, { algorithm: 'RS256' });

    const authResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`
    });

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`);
    }

    const tokenData = await authResponse.json();
    return tokenData.access_token;
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

    const accessToken = await getAnalyticsClient();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to initialize GA4 client' },
        { status: 500 }
      );
    }

    // 1. 페이지 전환 데이터 (페이지 경로별 세션)
    const pageTransitionsData = await fetchPageTransitions(accessToken, propertyId, startDate);
    
    // 2. 체류 시간 데이터
    const dwellTimeData = await fetchDwellTime(accessToken, propertyId, startDate);
    
    // 3. 스크롤 깊이 데이터
    const scrollDepthData = await fetchScrollDepth(accessToken, propertyId, startDate);
    
    // 4. 재방문율 데이터
    const revisitRateData = await fetchRevisitRate(accessToken, propertyId, startDate);
    
    // 5. 관심도 지표 (이벤트 기반)
    const interestMetricsData = await fetchInterestMetrics(accessToken, propertyId, startDate);
    
    // 6. 사용자 행동 패턴
    const behaviorPatternsData = await fetchBehaviorPatterns(accessToken, propertyId, startDate);
    
    // 7. 시간대별 분석
    const timeOfDayData = await fetchTimeOfDayAnalysis(accessToken, propertyId, startDate);
    
    // 8. 디바이스별 분석
    const deviceAnalysisData = await fetchDeviceAnalysis(accessToken, propertyId, startDate);

    // 9. 유입 경로 분석
    const entryPathData = await fetchEntryPathAnalysis(accessToken, propertyId, startDate);
    
    // 10. 이탈 페이지 및 전환 목표 분석
    const exitGoalData = await fetchExitGoalAnalysis(accessToken, propertyId, startDate);

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
async function fetchPageTransitions(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      }
    );

    if (!response.ok) {
      console.error('Page transitions API error:', response.status);
      return [];
    }

    const data = await response.json();
    const transitions: any[] = [];
    const transitionMap = new Map<string, number>();

    data.rows?.forEach((row: any) => {
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
async function fetchDwellTime(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'averageSessionDuration' },
            { name: 'sessions' },
            { name: 'screenPageViews' }
          ],
          limit: 50
        })
      }
    );

    if (!response.ok) {
      console.error('Dwell time API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.rows?.map((row: any) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const avgTime = parseFloat(row.metricValues?.[0]?.value || '0') / 1000; // 초 단위로 변환
      const sessions = parseInt(row.metricValues?.[1]?.value || '0');
      
      return {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        avgTime: Math.round(avgTime * 10) / 10,
        sessions
      };
    }).filter((item: any) => item.sessions > 0) || [];

  } catch (error) {
    console.error('Error fetching dwell time:', error);
    return [];
  }
}

// 스크롤 깊이 데이터 가져오기 (이벤트 기반)
async function fetchScrollDepth(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
                value: 'scroll'
              }
            }
          },
          limit: 100
        })
      }
    );

    if (!response.ok) {
      console.error('Scroll depth API error:', response.status);
      return [];
    }

    const data = await response.json();
    const scrollMap = new Map<string, { count: number; sessions: number }>();

    data.rows?.forEach((row: any) => {
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
async function fetchRevisitRate(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'returningUsers' }
          ],
          limit: 50
        })
      }
    );

    if (!response.ok) {
      console.error('Revisit rate API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.rows?.map((row: any) => {
      const page = row.dimensionValues?.[0]?.value || '';
      const sessions = parseInt(row.metricValues?.[0]?.value || '0');
      const totalUsers = parseInt(row.metricValues?.[1]?.value || '0');
      const returningUsers = parseInt(row.metricValues?.[2]?.value || '0');
      
      const revisitRate = totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0;

      return {
        page: page.length > 30 ? page.substring(0, 30) + '...' : page,
        rate: Math.round(revisitRate * 10) / 10,
        totalVisits: sessions
      };
    }).filter((item: any) => item.totalVisits > 0) || [];

  } catch (error) {
    console.error('Error fetching revisit rate:', error);
    return [];
  }
}

// 관심도 지표 데이터 가져오기 (이벤트 기반)
async function fetchInterestMetrics(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'sessions' },
            { name: 'totalUsers' }
          ],
          limit: 50
        })
      }
    );

    if (!response.ok) {
      console.error('Interest metrics API error:', response.status);
      return [];
    }

    const data = await response.json();
    const eventCategories = {
      'click': '클릭 상호작용',
      'scroll': '스크롤 활동',
      'form': '폼 상호작용',
      'video': '비디오 활동',
      'download': '다운로드',
      'share': '공유 활동',
      'search': '검색 활동',
      'purchase': '구매 활동'
    };

    const categoryMap = new Map<string, { engagement: number; conversion: number; count: number }>();

    data.rows?.forEach((row: any) => {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const eventCount = parseInt(row.metricValues?.[0]?.value || '0');
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
        engagement: existing.engagement + (sessions > 0 ? (eventCount / sessions) * 100 : 0),
        conversion: existing.conversion + (users > 0 ? (eventCount / users) * 100 : 0),
        count: existing.count + eventCount
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
async function fetchBehaviorPatterns(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      }
    );

    if (!response.ok) {
      console.error('Behavior patterns API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.rows?.map((row: any) => {
      const channel = row.dimensionValues?.[0]?.value || 'Unknown';
      const device = row.dimensionValues?.[1]?.value || 'Unknown';
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
    }).filter((item: any) => item.frequency > 0) || [];

  } catch (error) {
    console.error('Error fetching behavior patterns:', error);
    return [];
  }
}

// 시간대별 분석
async function fetchTimeOfDayAnalysis(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'hour' }],
          metrics: [
            { name: 'sessions' },
            { name: 'engagementRate' }
          ],
          limit: 24
        })
      }
    );

    if (!response.ok) {
      console.error('Time of day API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.rows?.map((row: any) => {
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
async function fetchDeviceAnalysis(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
          ],
          limit: 10
        })
      }
    );

    if (!response.ok) {
      console.error('Device analysis API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.rows?.map((row: any) => {
      const device = row.dimensionValues?.[0]?.value || 'Unknown';
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
    }).filter((item: any) => item.sessions > 0) || [];

  } catch (error) {
    console.error('Error fetching device analysis:', error);
    return [];
  }
}

// 유입 경로 분석
async function fetchEntryPathAnalysis(accessToken: string, propertyId: string, startDate: string) {
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      }
    );

    if (!response.ok) {
      console.error('Entry path API error:', response.status);
      return [];
    }

    const data = await response.json();
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

    data.rows?.forEach((row: any) => {
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
async function fetchExitGoalAnalysis(accessToken: string, propertyId: string, startDate: string) {
  try {
    // 이탈 페이지 분석
    const exitResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'sessions' },
            { name: 'exits' },
            { name: 'exitRate' }
          ],
          limit: 50
        })
      }
    );

    // 전환 목표 분석
    const conversionResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      }
    );

    if (!exitResponse.ok || !conversionResponse.ok) {
      console.error('Exit goal API error:', exitResponse.status, conversionResponse.status);
      return { exitPages: [], conversionPages: [] };
    }

    const exitData = await exitResponse.json();
    const conversionData = await conversionResponse.json();

    // 이탈 페이지 데이터
    const exitPages = exitData.rows?.map((row: any) => {
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
    }).filter((item: any) => item.sessions > 0) || [];

    // 전환 목표 데이터
    const conversionMap = new Map<string, { page: string; conversions: number; sessions: number }>();
    
    conversionData.rows?.forEach((row: any) => {
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