'use client'

import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import AIInsightCard from '../../components/AIInsightCard'

export default function SessionsAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [propertyId, setPropertyId] = useState('464147982') // Default property ID
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const propId = urlParams.get('propertyId') || '464147982'
      setPropertyId(propId)
    }
  }, [])

  useEffect(() => {
    loadSessionsData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
  }, [period, propertyId, loadSessionsData, fetchLatestInsight])

  const loadSessionsData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/analytics/sessions-detail?period=${period}&propertyId=${propertyId}`
      )
      const result = await response.json()
      setData(result)

      if (response.ok) {
        toast.success('세션 분석 데이터 로드 완료')
      }
    } catch (error) {
      toast.error('세션 데이터 로드 실패')
      console.error('Sessions analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [period, propertyId])

  const fetchLatestInsight = useCallback(async () => {
    const res = await fetch(`/api/ai-insight?type=sessions&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }, [propertyId])

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'sessions',
        propertyId: propertyId, // propertyId needs to be dynamic
        prompt:
          `다음은 세션 분석 데이터입니다.\n\n` +
          `총 세션: ${data?.totalSessions || 0}\n` +
          `평균 세션 시간: ${data?.avgSessionDuration || 0}초\n` +
          `세션당 페이지뷰: ${data?.pagesPerSession || 0}\n` +
          `이탈률: ${data?.bounceRate ? (data.bounceRate * 100).toFixed(1) : '0.0'}%\n` +
          `시간대별 세션 분포: ${JSON.stringify(data?.sessionsByHour || [])}\n` +
          `기기별 세션: ${JSON.stringify(data?.sessionsByDevice || [])}\n` +
          `지역별 세션: ${JSON.stringify(data?.sessionsByCountry || [])}\n` +
          `주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.`,
      }

      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const result = await res.json()
      if (result.success) {
        fetchLatestInsight()
      } else {
        toast.error('AI 인사이트 생성 실패: ' + (result.error || ''))
      }
    } catch (e: any) {
      toast.error('AI 인사이트 생성 중 오류: ' + (e.message || ''))
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
                세션 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">사용자 세션의 패턴과 행동을 분석합니다</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7daysAgo">지난 7일</option>
              <option value="30daysAgo">지난 30일</option>
              <option value="90daysAgo">지난 90일</option>
            </select>

            {availableModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 Gemini 모델 선택"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleGenerateInsight}
              disabled={insightLoading || !selectedModel}
              className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm leading-4 font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <SparklesIcon className={`h-4 w-4 mr-2 ${insightLoading ? 'animate-spin' : ''}`} />
              {insightLoading ? 'AI 분석 중...' : 'AI 인사이트'}
            </button>
          </div>
        </div>

        {/* AI 인사이트 섹션 */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-7 w-7 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">AI 기반 인사이트</h2>
            </div>
            <button
              onClick={handleGenerateInsight}
              disabled={insightLoading || !selectedModel}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {insightLoading ? (
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-500" />
              ) : (
                <SparklesIcon className="-ml-1 mr-2 h-5 w-5 text-indigo-500" />
              )}
              {insightLoading ? '인사이트 생성 중...' : '인사이트 다시 생성'}
            </button>
          </div>

          {insightLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="ml-3 text-gray-600">AI가 데이터를 분석하고 있습니다...</p>
            </div>
          ) : latestInsight?.result ? (
            <AIInsightCard result={latestInsight.result} />
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>아직 생성된 AI 인사이트가 없습니다. '인사이트 다시 생성' 버튼을 눌러주세요.</p>
            </div>
          )}
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.totalSessions?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 세션 시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.avgSessionDuration
                    ? `${Math.round(data.avgSessionDuration / 60)}분`
                    : '0분'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">세션당 페이지뷰</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.pagesPerSession?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">이탈률</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.bounceRate ? `${(data.bounceRate * 100).toFixed(1)}%` : '0.0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 시간대별 세션 분포 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시간대별 세션 분포</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-6 gap-4">
              {data?.sessionsByHour?.map((hour: any) => (
                <div key={hour.hour} className="text-center">
                  <div className="text-sm text-gray-600">{hour.hour}시</div>
                  <div
                    className="mt-2 bg-blue-200 rounded h-16 flex items-end justify-center"
                    style={{
                      height: `${Math.max(20, (hour.sessions / Math.max(...(data.sessionsByHour?.map((h: any) => h.sessions) || [1]))) * 60)}px`,
                    }}
                  >
                    <div
                      className="bg-blue-600 w-full rounded"
                      style={{
                        height: `${Math.max(4, (hour.sessions / Math.max(...(data.sessionsByHour?.map((h: any) => h.sessions) || [1]))) * 56)}px`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-800 font-medium mt-1">{hour.sessions}</div>
                </div>
              )) ||
                Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm text-gray-600">{i}시</div>
                    <div className="mt-2 bg-gray-200 rounded h-4"></div>
                    <div className="text-xs text-gray-800 font-medium mt-1">0</div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 기기별 세션 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">기기별 세션</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.sessionsByDevice?.map((device: any) => (
                  <div key={device.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: device.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900">{device.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {device.sessions.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{device.percentage}%</div>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-8">데이터를 불러오는 중...</div>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">지역별 세션</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data?.sessionsByCountry?.map((country: any, index: number) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {country.sessions.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{country.percentage}%</div>
                    </div>
                  </div>
                )) || <div className="text-center text-gray-500 py-8">데이터를 불러오는 중...</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
