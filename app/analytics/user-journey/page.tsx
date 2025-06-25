'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Doughnut, Scatter, Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UserJourneyData {
  pageTransitions: {
    from: string;
    to: string;
    count: number;
  }[];
  dwellTime: {
    page: string;
    avgTime: number;
    sessions: number;
  }[];
  scrollDepth: {
    page: string;
    avgDepth: number;
    sessions: number;
  }[];
  revisitRate: {
    page: string;
    rate: number;
    totalVisits: number;
  }[];
  interestMetrics: {
    category: string;
    engagement: number;
    conversion: number;
  }[];
  userBehaviorPatterns: {
    pattern: string;
    frequency: number;
    avgEngagement: number;
    conversionRate: number;
  }[];
  timeOfDayAnalysis: {
    hour: number;
    sessions: number;
    avgEngagement: number;
  }[];
  deviceAnalysis: {
    device: string;
    sessions: number;
    avgTime: number;
    conversionRate: number;
  }[];
  entryPathAnalysis: {
    channel: string;
    source: string;
    medium: string;
    campaign: string;
    landingPage: string;
    sessions: number;
    users: number;
    engagementRate: number;
    avgDuration: number;
  }[];
  exitGoalAnalysis: {
    exitPages: {
      page: string;
      sessions: number;
      exits: number;
      exitRate: number;
    }[];
    conversionPages: {
      page: string;
      conversions: number;
      sessions: number;
      conversionRate: number;
    }[];
  };
}

export default function UserJourneyPage() {
  const [data, setData] = useState<UserJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [insight, setInsight] = useState<string>('');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [propertyId, setPropertyId] = useState('464147982');

  useEffect(() => {
    // URL 파라미터에서 propertyId 읽기
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const propId = urlParams.get('propertyId') || '464147982';
      setPropertyId(propId);
    }
  }, []);

  useEffect(() => {
    fetchUserJourneyData();
    fetchLatestInsight();
  }, [selectedPeriod, propertyId]);

  const fetchUserJourneyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/user-journey?period=${selectedPeriod}&propertyId=${propertyId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching user journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestInsight = async () => {
    try {
      const response = await fetch(`/api/ai-insight?type=user-journey&propertyId=${propertyId}`);
      if (response.ok) {
        const result = await response.json();
        setInsight(result.insight || '');
      }
    } catch (error) {
      console.error('Error fetching insight:', error);
    }
  };

  const generateInsight = async () => {
    try {
      setGeneratingInsight(true);
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user-journey',
          data: data,
          period: selectedPeriod,
          propertyId: propertyId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setInsight(result.insight);
      }
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '개요' },
    { id: 'transitions', name: '페이지 전환' },
    { id: 'engagement', name: '참여도 분석' },
    { id: 'patterns', name: '행동 패턴' },
    { id: 'timing', name: '시간대 분석' },
    { id: 'entryPath', name: '유입 경로 분석' },
    { id: 'exitGoal', name: '이탈/전환 목표 분석' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">사용자 여정 분석</h1>
        <div className="flex gap-4">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">7일</option>
            <option value="30d">30일</option>
            <option value="90d">90일</option>
          </select>
          <button 
            onClick={generateInsight}
            disabled={generatingInsight}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingInsight ? '분석 중...' : 'AI 인사이트 생성'}
          </button>
        </div>
      </div>

      {/* AI 인사이트 섹션 */}
      {insight && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center gap-2">
            🤖 AI 인사이트
          </h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{insight}</p>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 페이지 전환 경로 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">주요 페이지 전환</h3>
            {data?.pageTransitions && data.pageTransitions.length > 0 ? (
              <div className="space-y-4">
                {data.pageTransitions.slice(0, 5).map((transition, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{transition.from}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium">{transition.to}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {transition.count.toLocaleString()}회
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                페이지 전환 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 체류 시간 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">페이지별 평균 체류 시간</h3>
            {data?.dwellTime && data.dwellTime.length > 0 ? (
              <Bar
                data={{
                  labels: data.dwellTime.map(item => item.page),
                  datasets: [{
                    label: '평균 체류 시간 (초)',
                    data: data.dwellTime.map(item => item.avgTime),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y.toFixed(1)}초`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: '초' }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                체류 시간 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 스크롤 깊이 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">페이지별 스크롤 깊이</h3>
            {data?.scrollDepth && data.scrollDepth.length > 0 ? (
              <Doughnut
                data={{
                  labels: data.scrollDepth.map(item => item.page),
                  datasets: [{
                    data: data.scrollDepth.map(item => item.avgDepth),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.8)',
                      'rgba(54, 162, 235, 0.8)',
                      'rgba(255, 206, 86, 0.8)',
                      'rgba(75, 192, 192, 0.8)',
                      'rgba(153, 102, 255, 0.8)',
                    ],
                    borderWidth: 2,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.label}: ${context.parsed.toFixed(1)}%`
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                스크롤 깊이 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 재방문율 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">페이지별 재방문율</h3>
            {data?.revisitRate && data.revisitRate.length > 0 ? (
              <Line
                data={{
                  labels: data.revisitRate.map(item => item.page),
                  datasets: [{
                    label: '재방문율 (%)',
                    data: data.revisitRate.map(item => item.rate),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.parsed.y.toFixed(1)}%`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: { display: true, text: '재방문율 (%)' }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                재방문율 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transitions' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">전체 페이지 전환 경로</h3>
            {data?.pageTransitions && data.pageTransitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.pageTransitions.map((transition, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{transition.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-medium">{transition.to}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-blue-600">
                        {transition.count.toLocaleString()}회
                      </span>
                      <div className="text-xs text-gray-500">
                        {((transition.count / data.pageTransitions.reduce((sum, t) => sum + t.count, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                페이지 전환 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 페이지 전환 히트맵 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">페이지 전환 히트맵</h3>
            {data?.pageTransitions && data.pageTransitions.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {renderTransitionHeatmap(data.pageTransitions)}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                히트맵 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 관심도 지표 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">카테고리별 관심도 지표</h3>
            {data?.interestMetrics && data.interestMetrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.interestMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{metric.category}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">참여도:</span>
                        <span className="font-medium">{metric.engagement.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">전환율:</span>
                        <span className="font-medium">{metric.conversion.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                관심도 지표 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 디바이스 분석 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">디바이스별 분석</h3>
            {data?.deviceAnalysis && data.deviceAnalysis.length > 0 ? (
              <Bar
                data={{
                  labels: data.deviceAnalysis.map(item => item.device),
                  datasets: [
                    {
                      label: '세션 수',
                      data: data.deviceAnalysis.map(item => item.sessions),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      yAxisID: 'y',
                    },
                    {
                      label: '전환율 (%)',
                      data: data.deviceAnalysis.map(item => item.conversionRate),
                      backgroundColor: 'rgba(255, 99, 132, 0.8)',
                      yAxisID: 'y1',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      title: { display: true, text: '세션 수' }
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      title: { display: true, text: '전환율 (%)' },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                디바이스 분석 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">사용자 행동 패턴</h3>
            {data?.userBehaviorPatterns && data.userBehaviorPatterns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.userBehaviorPatterns.map((pattern, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">{pattern.pattern}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">빈도:</span>
                        <span className="font-medium">{pattern.frequency}회</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">평균 참여도:</span>
                        <span className="font-medium">{pattern.avgEngagement.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">전환율:</span>
                        <span className="font-medium">{pattern.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                사용자 행동 패턴 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timing' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">시간대별 분석</h3>
            {data?.timeOfDayAnalysis && data.timeOfDayAnalysis.length > 0 ? (
              <Line
                data={{
                  labels: data.timeOfDayAnalysis.map(item => `${item.hour}시`),
                  datasets: [
                    {
                      label: '세션 수',
                      data: data.timeOfDayAnalysis.map(item => item.sessions),
                      borderColor: 'rgba(59, 130, 246, 1)',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      fill: true,
                      yAxisID: 'y',
                    },
                    {
                      label: '평균 참여도 (%)',
                      data: data.timeOfDayAnalysis.map(item => item.avgEngagement),
                      borderColor: 'rgba(255, 99, 132, 1)',
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      fill: true,
                      yAxisID: 'y1',
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  interaction: {
                    mode: 'index' as const,
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      title: { display: true, text: '세션 수' }
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      title: { display: true, text: '참여도 (%)' },
                      grid: {
                        drawOnChartArea: false,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                시간대별 분석 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entryPath' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">유입 경로 분석</h3>
            {data?.entryPathAnalysis && data.entryPathAnalysis.length > 0 ? (
              <div className="space-y-6">
                {/* 채널별 유입 분포 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">채널별 유입 분포</h4>
                  <div className="h-64">
                    <Doughnut
                      data={{
                        labels: data.entryPathAnalysis.map(item => `${item.channel} (${item.source})`),
                        datasets: [{
                          data: data.entryPathAnalysis.map(item => item.sessions),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)',
                          ],
                          borderWidth: 2,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.label}: ${context.parsed.toLocaleString()} 세션`
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 상세 유입 경로 분석 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">상세 유입 경로 분석</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.entryPathAnalysis.map((analysis, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-sm">{analysis.channel}</h5>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {analysis.sessions} 세션
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">소스:</span>
                            <span className="font-medium">{analysis.source}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">매체:</span>
                            <span className="font-medium">{analysis.medium}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">캠페인:</span>
                            <span className="font-medium">{analysis.campaign || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">참여율:</span>
                            <span className="font-medium">{analysis.engagementRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">평균 시간:</span>
                            <span className="font-medium">{analysis.avgDuration.toFixed(1)}초</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600 truncate" title={analysis.landingPage}>
                            랜딩: {analysis.landingPage}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 랜딩 페이지 성과 분석 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">랜딩 페이지 성과 분석</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            랜딩 페이지
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            세션 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            참여율
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            평균 체류 시간
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.entryPathAnalysis
                          .filter(item => item.landingPage)
                          .sort((a, b) => b.sessions - a.sessions)
                          .slice(0, 10)
                          .map((analysis, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {analysis.landingPage.length > 40 
                                  ? analysis.landingPage.substring(0, 40) + '...' 
                                  : analysis.landingPage}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {analysis.sessions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {analysis.engagementRate.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {analysis.avgDuration.toFixed(1)}초
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                유입 경로 분석 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exitGoal' && (
        <div className="space-y-6">
          {/* 이탈 페이지 분석 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">이탈 페이지 분석</h3>
            {data?.exitGoalAnalysis && data.exitGoalAnalysis.exitPages.length > 0 ? (
              <div className="space-y-6">
                {/* 이탈율 차트 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">페이지별 이탈율</h4>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: data.exitGoalAnalysis.exitPages.map(item => item.page),
                        datasets: [{
                          label: '이탈율 (%)',
                          data: data.exitGoalAnalysis.exitPages.map(item => item.exitRate),
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          borderColor: 'rgba(239, 68, 68, 1)',
                          borderWidth: 1,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `이탈율: ${context.parsed.y.toFixed(1)}%`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: '이탈율 (%)' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 이탈 페이지 상세 분석 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">이탈 페이지 상세 분석</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            페이지
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            세션 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이탈 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            이탈율
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.exitGoalAnalysis.exitPages
                          .sort((a, b) => b.exitRate - a.exitRate)
                          .map((exit, index) => (
                            <tr key={index} className={exit.exitRate > 80 ? 'bg-red-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {exit.page}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {exit.sessions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {exit.exits.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  exit.exitRate > 80 ? 'bg-red-100 text-red-800' :
                                  exit.exitRate > 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {exit.exitRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                이탈 페이지 데이터가 없습니다.
              </div>
            )}
          </div>

          {/* 전환 목표 분석 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">전환 목표 분석</h3>
            {data?.exitGoalAnalysis && data.exitGoalAnalysis.conversionPages.length > 0 ? (
              <div className="space-y-6">
                {/* 전환율 차트 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">페이지별 전환율</h4>
                  <div className="h-64">
                    <Bar
                      data={{
                        labels: data.exitGoalAnalysis.conversionPages.map(item => item.page),
                        datasets: [{
                          label: '전환율 (%)',
                          data: data.exitGoalAnalysis.conversionPages.map(item => item.conversionRate),
                          backgroundColor: 'rgba(34, 197, 94, 0.8)',
                          borderColor: 'rgba(34, 197, 94, 1)',
                          borderWidth: 1,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `전환율: ${context.parsed.y.toFixed(1)}%`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: { display: true, text: '전환율 (%)' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 전환 페이지 상세 분석 */}
                <div>
                  <h4 className="text-md font-semibold mb-3">전환 페이지 상세 분석</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            페이지
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            세션 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전환 수
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            전환율
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.exitGoalAnalysis.conversionPages
                          .sort((a, b) => b.conversionRate - a.conversionRate)
                          .map((conversion, index) => (
                            <tr key={index} className={conversion.conversionRate > 10 ? 'bg-green-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {conversion.page}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conversion.sessions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conversion.conversions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  conversion.conversionRate > 10 ? 'bg-green-100 text-green-800' :
                                  conversion.conversionRate > 5 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {conversion.conversionRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                전환 페이지 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 히트맵 렌더링 함수
const renderTransitionHeatmap = (transitions: any[]) => {
  // 고유한 페이지 목록 추출
  const pages = new Set<string>();
  transitions.forEach(t => {
    pages.add(t.from);
    pages.add(t.to);
  });
  const pageList = Array.from(pages).slice(0, 10); // 상위 10개 페이지만

  // 전환 매트릭스 생성
  const matrix = pageList.map(from => 
    pageList.map(to => {
      const transition = transitions.find(t => t.from === from && t.to === to);
      return transition ? transition.count : 0;
    })
  );

  const maxValue = Math.max(...matrix.flat());

  return (
    <div className="space-y-2">
      {/* 헤더 */}
      <div className="flex">
        <div className="w-32"></div>
        {pageList.map((page, i) => (
          <div key={i} className="w-24 text-xs text-center text-gray-600 truncate px-1">
            {page.length > 8 ? page.substring(0, 8) + '...' : page}
          </div>
        ))}
      </div>
      
      {/* 히트맵 행들 */}
      {pageList.map((fromPage, i) => (
        <div key={i} className="flex items-center">
          <div className="w-32 text-xs text-gray-600 truncate pr-2">
            {fromPage.length > 12 ? fromPage.substring(0, 12) + '...' : fromPage}
          </div>
          {pageList.map((toPage, j) => {
            const value = matrix[i][j];
            const intensity = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const bgColor = intensity > 0 
              ? `bg-blue-${Math.max(100, Math.min(900, Math.round(intensity / 10) * 100))}`
              : 'bg-gray-100';
            
            return (
              <div 
                key={j} 
                className={`w-24 h-8 border border-gray-200 flex items-center justify-center text-xs ${
                  intensity > 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}
                style={{
                  backgroundColor: intensity > 0 
                    ? `rgba(59, 130, 246, ${intensity / 100})` 
                    : '#f3f4f6'
                }}
                title={`${fromPage} → ${toPage}: ${value}회`}
              >
                {value > 0 ? value : '-'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}; 