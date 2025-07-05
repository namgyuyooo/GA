'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { FunnelIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface ConversionGoal {
  id: string
  name: string
  goalType: string
}

interface PageJourney {
  journey: string
  steps: number
  conversions: number
  avgDuration: number
}

interface ConversionPathAnalysisData {
  goals: ConversionGoal[]
  pathAnalysis: { [goalId: string]: any }
  keywordAnalysis: { [goalId: string]: any }
  pageJourneyAnalysis: {
    [goalId: string]: {
      goalName: string
      entryPages: any[]
      commonJourneys: PageJourney[]
      totalConversions: number
    }
  }
  period: string
  message: string
}

export default function ConversionFunnelPage() {
  const [propertyId, setPropertyId] = useState('464147982') // Default property ID
  const [period, setPeriod] = useState('30daysAgo')
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined)
  const [analysisData, setAnalysisData] = useState<ConversionPathAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchConversionData()
  }, [propertyId, period, selectedGoalId])

  const fetchConversionData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        propertyId,
        period,
      })
      if (selectedGoalId) {
        params.append('goalId', selectedGoalId)
      }

      const response = await fetch(`/api/analytics/conversion-paths?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setAnalysisData(result)
        toast.success(result.message || '전환 퍼널 데이터 로드 완료')
      } else {
        toast.error(result.message || '전환 퍼널 데이터 로드 실패')
        setAnalysisData(null)
      }
    } catch (error) {
      console.error('Failed to fetch conversion funnel data:', error)
      toast.error('전환 퍼널 데이터 로드 중 오류 발생')
      setAnalysisData(null)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId, period, selectedGoalId])

  const renderFunnel = (goalId: string) => {
    const goalJourneys = analysisData?.pageJourneyAnalysis[goalId]?.commonJourneys || []
    const totalConversions = analysisData?.pageJourneyAnalysis[goalId]?.totalConversions || 0

    if (goalJourneys.length === 0) {
      return <p className="text-gray-500">선택된 목표에 대한 전환 여정 데이터가 없습니다.</p>
    }

    // Simple funnel visualization based on common journeys
    // This is a simplified representation. A real funnel would require more sophisticated data processing
    // to aggregate unique steps and calculate drop-offs between them.
    const uniquePages = new Set<string>()
    goalJourneys.forEach((journey) => {
      const pages = journey.journey.split(' → ')
      pages.forEach((page) => uniquePages.add(page))
    })

    const funnelSteps = Array.from(uniquePages)
      .map((page) => {
        let conversionsAtStep = 0
        goalJourneys.forEach((journey) => {
          const pages = journey.journey.split(' → ')
          if (pages.includes(page)) {
            conversionsAtStep += journey.conversions
          }
        })
        return { page, conversions: conversionsAtStep }
      })
      .sort((a, b) => b.conversions - a.conversions)

    // For a true funnel, we need to define the sequence of steps and calculate drop-offs.
    // This mock will just show pages involved and their total conversions.
    // A more advanced implementation would parse pageSequence from conversionPaths to build actual funnels.

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">주요 전환 여정</h4>
        {goalJourneys.slice(0, 5).map((journey, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-md shadow-sm">
            <p className="text-sm font-medium text-gray-700">{journey.journey}</p>
            <p className="text-xs text-gray-500">
              전환수: {journey.conversions}회, 평균 소요 시간: {journey.avgDuration}초
            </p>
          </div>
        ))}

        <h4 className="text-lg font-semibold text-gray-800 mt-6">퍼널 단계별 참여</h4>
        <div className="space-y-2">
          {funnelSteps.map((step, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border border-blue-200"
            >
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-700">{step.page}</span>
              </div>
              <span className="text-blue-600 font-semibold">{step.conversions}회 참여</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600 mt-4">총 전환수: {totalConversions}회</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <FunnelIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">전환 퍼널 분석</h1>
        </div>
        <p className="text-gray-600 mb-8">
          사용자의 전환 여정을 시각화하고, 각 단계별 전환율 및 이탈률을 분석하여 최적화 기회를
          발견합니다.
        </p>

        {/* 필터 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
              속성 ID
            </label>
            <input
              type="text"
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700">
              기간
            </label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="7daysAgo">지난 7일</option>
              <option value="30daysAgo">지난 30일</option>
              <option value="90daysAgo">지난 90일</option>
              <option value="180daysAgo">지난 180일</option>
            </select>
          </div>
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
              전환 목표
            </label>
            <select
              id="goal"
              value={selectedGoalId || ''}
              onChange={(e) => setSelectedGoalId(e.target.value || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">모든 목표</option>
              {analysisData?.goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">데이터 로드 중...</p>
          </div>
        ) : analysisData ? (
          <div className="space-y-10">
            {analysisData.goals.length > 0 ? (
              analysisData.goals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-md"
                >
                  <h3 className="text-2xl font-bold text-blue-800 mb-4">목표: {goal.name}</h3>
                  {renderFunnel(goal.id)}
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-gray-600">
                  분석할 전환 목표가 없습니다. 설정을 확인해주세요.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              데이터를 불러올 수 없습니다. 속성 ID와 기간을 확인해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
