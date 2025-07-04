'use client'

import { useState, useEffect } from 'react'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface WeekData {
  weekNumber: number
  startDate: string
  endDate: string
  label: string
}

interface WeeklyMetrics {
  totalSessions: number
  totalUsers: number
  conversions: number
  conversionRate: number
  avgSessionDuration: number
  pageViews: number
  topChannels: Array<{
    source: string
    medium: string
    sessions: number
    conversions: number
  }>
  topPages: Array<{
    path: string
    pageViews: number
    users: number
  }>
}

interface AIInsights {
  insights: string[]
  recommendations: string[]
  trends: string[]
  risks: string[]
  opportunities: string[]
}

interface WeeklyReportProps {
  propertyId: string
}

export default function WeeklyReport({ propertyId }: WeeklyReportProps) {
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<WeekData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyMetrics | null>(null)
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // 최근 8주간의 주차 데이터 생성
  useEffect(() => {
    const weeks = generateWeekOptions()
    setAvailableWeeks(weeks)
    if (weeks.length > 0) {
      setSelectedWeek(weeks[0]) // 가장 최근 주 선택
    }
  }, [])

  // 선택된 주가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedWeek) {
      loadWeeklyData(selectedWeek)
    }
  }, [selectedWeek, propertyId])

  const generateWeekOptions = (): WeekData[] => {
    const weeks: WeekData[] = []
    const today = new Date()
    
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (today.getDay() + 7 * i))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekNumber = getWeekNumber(weekStart)
      
      weeks.push({
        weekNumber,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        label: i === 0 ? '이번 주' : i === 1 ? '지난 주' : `${weekNumber}주차 (${weekStart.getMonth() + 1}/${weekStart.getDate()})`
      })
    }
    
    return weeks
  }

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const loadWeeklyData = async (week: WeekData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard/overview?startDate=${week.startDate}&endDate=${week.endDate}&propertyId=${propertyId}`)
      const data = await response.json()
      
      if (data.success) {
        setWeeklyData({
          totalSessions: data.data.kpis.totalSessions,
          totalUsers: data.data.kpis.totalUsers,
          conversions: data.data.kpis.conversions,
          conversionRate: data.data.kpis.conversionRate,
          avgSessionDuration: 120, // TODO: 실제 데이터에서 가져오기
          pageViews: data.data.kpis.pageViews,
          topChannels: data.data.topCampaigns.slice(0, 5),
          topPages: data.data.topPages.slice(0, 5)
        })
      }
    } catch (error) {
      console.error('Failed to load weekly data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIReport = async () => {
    if (!weeklyData || !selectedWeek) return
    
    setIsGeneratingReport(true)
    try {
      const response = await fetch('/api/weekly-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: false,
          schedule: {
            name: `${selectedWeek.label} 주간보고서`,
            propertyIds: [propertyId],
            includeAI: true,
            includeSummary: true,
            includeIssues: true,
            aiPrompt: `당신은 10년차 제조 B2B 마케팅 전문가이자 트렌드 심리학 박사입니다. 

**전문 배경:**
- 반도체, 디스플레이, 정밀기계 등 제조업 마케팅 10년 경험
- B2B 구매 심리와 의사결정 프로세스 전문가
- 데이터 기반 마케팅 전략 수립 및 실행 경험
- 제조업 디지털 전환 컨설팅 경험

**분석 데이터:**
- 기간: ${selectedWeek.startDate} ~ ${selectedWeek.endDate}
- 총 세션: ${weeklyData.totalSessions.toLocaleString()}
- 총 사용자: ${weeklyData.totalUsers.toLocaleString()}
- 전환: ${weeklyData.conversions.toLocaleString()}건
- 전환율: ${(weeklyData.conversionRate * 100).toFixed(2)}%
- 페이지뷰: ${weeklyData.pageViews.toLocaleString()}

**주요 채널:**
${weeklyData.topChannels.map(channel => 
  `- ${channel.source}/${channel.medium}: ${channel.sessions}세션, ${channel.conversions}전환`
).join('\n')}

**주요 페이지:**
${weeklyData.topPages.map(page => 
  `- ${page.path}: ${page.pageViews}뷰, ${page.users}사용자`
).join('\n')}

**종합 분석 요청사항:**

## 🎯 **제조업 B2B 관점 성과 평가**
- 제조업 평균 대비 성과 벤치마킹
- B2B 구매 깔때기 단계별 전환율 분석
- 기술적 콘텐츠 vs 비즈니스 콘텐츠 성과 비교

## 🧠 **트렌드 심리학 기반 고객 행동 분석**
- 제조업 고객의 정보 탐색 패턴 분석
- 기술적 의사결정자 vs 비즈니스 의사결정자 행동 차이
- 페이지 체류시간과 관심도 상관관계

## 📊 **채널별 효과성 및 고객 품질 분석**
- 각 채널의 리드 품질과 전환 가능성 평가
- 제조업 특성을 고려한 채널 믹스 최적화
- 유기 검색 vs 직접 방문 성과 차이

## ⚡ **즉시 실행 권장사항** (1주 내)
- 전환율 개선을 위한 즉시 조치사항
- A/B 테스트 가능한 요소들
- 콘텐츠 개선 우선순위

## 🚀 **중장기 전략 권고** (1개월 내)
- 제조업 마케팅 믹스 최적화 방향
- 신규 채널 진입 기회 평가
- 브랜드 포지셔닝 강화 전략

각 섹션별로 핵심 포인트 2-3개씩 간결하고 실행 가능한 형태로 제시해주세요.`
          }
        })
      })
      
      const result = await response.json()
      if (result.success && result.report.aiAnalysis) {
        setAIInsights(result.report.aiAnalysis)
      }
    } catch (error) {
      console.error('Failed to generate AI report:', error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const exportReport = () => {
    if (!weeklyData || !selectedWeek) return
    
    const reportContent = generateReportContent()
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `weekly-report-${selectedWeek.startDate}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateReportContent = (): string => {
    if (!weeklyData || !selectedWeek) return ''
    
    return `
RTM AI 주간보고서
${selectedWeek.label} (${selectedWeek.startDate} ~ ${selectedWeek.endDate})

=== 핵심 지표 ===
총 세션: ${weeklyData.totalSessions.toLocaleString()}
총 사용자: ${weeklyData.totalUsers.toLocaleString()}
전환: ${weeklyData.conversions.toLocaleString()}건
전환율: ${(weeklyData.conversionRate * 100).toFixed(2)}%
페이지뷰: ${weeklyData.pageViews.toLocaleString()}

=== 상위 채널 ===
${weeklyData.topChannels.map(channel => 
  `${channel.source}/${channel.medium}: ${channel.sessions}세션 (전환 ${channel.conversions}건)`
).join('\n')}

=== 상위 페이지 ===
${weeklyData.topPages.map(page => 
  `${page.path}: ${page.pageViews}뷰 (${page.users}명)`
).join('\n')}

${aiInsights ? `
=== AI 분석 결과 ===

주요 인사이트:
${aiInsights.insights.map(insight => `- ${insight}`).join('\n')}

실행 권장사항:
${aiInsights.recommendations.map(rec => `- ${rec}`).join('\n')}

트렌드 분석:
${aiInsights.trends.map(trend => `- ${trend}`).join('\n')}
` : ''}
`
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">주간보고서</h1>
              <p className="text-sm text-gray-500">제조업 B2B 마케팅 전문가 관점의 종합 분석</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 주차 선택 드롭다운 */}
            <select
              value={selectedWeek?.startDate || ''}
              onChange={(e) => {
                const week = availableWeeks.find(w => w.startDate === e.target.value)
                if (week) setSelectedWeek(week)
              }}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {availableWeeks.map((week) => (
                <option key={week.startDate} value={week.startDate}>
                  {week.label}
                </option>
              ))}
            </select>

            <button
              onClick={generateAIReport}
              disabled={isGeneratingReport || !weeklyData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <SparklesIcon className="mr-2 h-4 w-4" />
              {isGeneratingReport ? 'AI 분석 중...' : 'AI 분석 생성'}
            </button>

            <button
              onClick={exportReport}
              disabled={!weeklyData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              내보내기
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">데이터 로드 중...</span>
          </div>
        </div>
      ) : weeklyData ? (
        <>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">총 세션</dt>
                      <dd className="text-lg font-medium text-gray-900">{weeklyData.totalSessions.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">총 사용자</dt>
                      <dd className="text-lg font-medium text-gray-900">{weeklyData.totalUsers.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUpIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">전환</dt>
                      <dd className="text-lg font-medium text-gray-900">{weeklyData.conversions.toLocaleString()}건</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUpIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">전환율</dt>
                      <dd className="text-lg font-medium text-gray-900">{(weeklyData.conversionRate * 100).toFixed(2)}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 상위 채널 및 페이지 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">상위 트래픽 채널</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {weeklyData.topChannels.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {channel.source} / {channel.medium}
                        </div>
                        <div className="text-sm text-gray-500">
                          {channel.sessions.toLocaleString()} 세션
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {channel.conversions}건
                        </div>
                        <div className="text-xs text-gray-500">
                          {((channel.conversions / channel.sessions) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">상위 페이지</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {weeklyData.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {page.path}
                        </div>
                        <div className="text-sm text-gray-500">
                          {page.users.toLocaleString()} 사용자
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {page.pageViews.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">페이지뷰</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI 분석 결과 */}
          {aiInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 인사이트 & 권장사항 */}
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-medium text-gray-900">주요 인사이트</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {aiInsights.insights.map((insight, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-yellow-800">{index + 1}</span>
                          </div>
                          <span className="text-sm text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-medium text-gray-900">실행 권장사항</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {aiInsights.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-800">{index + 1}</span>
                          </div>
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 트렌드 & 위험/기회 */}
              <div className="space-y-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <TrendingUpIcon className="h-5 w-5 text-green-500" />
                      <h3 className="text-lg font-medium text-gray-900">트렌드 분석</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {aiInsights.trends.map((trend, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <TrendingUpIcon className="flex-shrink-0 h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {aiInsights.risks && aiInsights.risks.length > 0 && (
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-medium text-gray-900">위험 신호</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {aiInsights.risks.map((risk, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <ExclamationTriangleIcon className="flex-shrink-0 h-4 w-4 text-red-500 mt-0.5" />
                            <span className="text-sm text-gray-700">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {aiInsights.opportunities && aiInsights.opportunities.length > 0 && (
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-medium text-gray-900">기회 요소</h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3">
                        {aiInsights.opportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <SparklesIcon className="flex-shrink-0 h-4 w-4 text-purple-500 mt-0.5" />
                            <span className="text-sm text-gray-700">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">데이터 없음</h3>
            <p className="mt-1 text-sm text-gray-500">선택한 주차의 데이터를 찾을 수 없습니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}