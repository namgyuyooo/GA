'use client'

import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SparklesIcon,
  ArrowPathIcon,
  UsersIcon,
  EyeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import AIInsightCard from '../../components/AIInsightCard'

function TrafficAudienceContent() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [propertyId, setPropertyId] = useState('464147982')
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [activeTab, setActiveTab] = useState('traffic')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const propId = urlParams.get('propertyId') || '464147982'
      setPropertyId(propId)
    }
  }, [])

  const fetchLatestInsight = useCallback(async () => {
    const res = await fetch(`/api/ai-insight?type=traffic-audience&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }, [propertyId])

  const loadTrafficAudienceData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [sessionsRes, usersRes, pageviewsRes] = await Promise.all([
        fetch(`/api/analytics/sessions-detail?period=${period}&propertyId=${propertyId}`),
        fetch(`/api/analytics/users-detail?period=${period}&propertyId=${propertyId}`),
        fetch(`/api/analytics/pageviews-detail?period=${period}&propertyId=${propertyId}`),
      ])

      const [sessionsData, usersData, pageviewsData] = await Promise.all([
        sessionsRes.json(),
        usersRes.json(),
        pageviewsRes.json(),
      ])

      if (sessionsData.success && usersData.success && pageviewsData.success) {
        setData({
          sessions: sessionsData.data,
          users: usersData.data,
          pageviews: pageviewsData.data,
        })
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch (error: any) {
      toast.error('데이터 로드 중 오류: ' + (error.message || ''))
    } finally {
      setIsLoading(false)
    }
  }, [period, propertyId])

  useEffect(() => {
    loadTrafficAudienceData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
      .catch((error) => {
        console.error('AI 모델 로드 실패:', error)
        // 기본 모델 설정
        setSelectedModel('gemini-pro')
        setAvailableModels([{ id: 'gemini-pro', displayName: 'Gemini Pro' }])
      })
  }, [period, propertyId, loadTrafficAudienceData, fetchLatestInsight])

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody = {
        model: selectedModel,
        type: 'traffic-audience',
        propertyId: propertyId,
        prompt: `다음은 트래픽 및 사용자 분석 데이터입니다.

세션 데이터:
- 총 세션: ${data?.sessions?.totalSessions || 0}
- 평균 세션 시간: ${data?.sessions?.avgSessionDuration || 0}초
- 이탈률: ${data?.sessions?.bounceRate ? (data.sessions.bounceRate * 100).toFixed(1) : '0.0'}%
- 기기별 분포: ${JSON.stringify(data?.sessions?.sessionsByDevice || [])}

사용자 데이터:
- 총 사용자: ${data?.users?.totalUsers || 0}
- 신규 사용자: ${data?.users?.newUsers || 0}
- 재방문자: ${data?.users?.returningUsers || 0}
- 지역별 분포: ${JSON.stringify(data?.users?.usersByCountry || [])}

페이지뷰 데이터:
- 총 페이지뷰: ${data?.pageviews?.totalPageviews || 0}
- 상위 페이지: ${JSON.stringify(data?.pageviews?.topPages?.slice(0, 5) || [])}

트래픽과 사용자 행동을 분석하여 3가지 주요 인사이트와 2가지 개선 제안을 한국어로 요약해주세요.`,
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

  const tabs = [
    { id: 'traffic', name: '트래픽', icon: ChartBarIcon },
    { id: 'audience', name: '사용자', icon: UsersIcon },
    { id: 'sources', name: '트래픽 소스', icon: GlobeAltIcon },
  ]

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
                트래픽 & 사용자 분석
              </h1>
              <p className="text-gray-600 mt-1">웹사이트 방문자와 트래픽 패턴을 종합 분석합니다</p>
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
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

        {/* 탭 네비게이션 */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'traffic' && (
              <div className="space-y-6">
                {/* 주요 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 세션</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.totalSessions?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <EyeIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 페이지뷰</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.pageviews?.totalPageviews?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">평균 세션 시간</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.avgSessionDuration
                            ? `${Math.round(data.sessions.avgSessionDuration / 60)}분`
                            : '0분'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">이탈률</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.bounceRate
                            ? `${(data.sessions.bounceRate * 100).toFixed(1)}%`
                            : '0.0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 기기별 & 시간대별 세션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">기기별 세션</h3>
                    <div className="space-y-4">
                      {data?.sessions?.sessionsByDevice?.map((device: any) => (
                        <div key={device.category} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: device.color }}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              {device.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {device.sessions.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{device.percentage}%</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">시간대별 세션</h3>
                    <div className="grid grid-cols-6 gap-2">
                      {data?.sessions?.sessionsByHour?.map((hour: any) => (
                        <div key={hour.hour} className="text-center">
                          <div className="text-xs text-gray-600">{hour.hour}시</div>
                          <div
                            className="mt-1 bg-blue-200 rounded flex items-end justify-center"
                            style={{
                              height: `${Math.max(20, (hour.sessions / Math.max(...(data.sessions.sessionsByHour?.map((h: any) => h.sessions) || [1]))) * 40)}px`,
                            }}
                          >
                            <div
                              className="bg-blue-600 w-full rounded"
                              style={{
                                height: `${Math.max(4, (hour.sessions / Math.max(...(data.sessions.sessionsByHour?.map((h: any) => h.sessions) || [1]))) * 36)}px`,
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-800 font-medium mt-1">
                            {hour.sessions}
                          </div>
                        </div>
                      )) ||
                        Array.from({ length: 24 }, (_, i) => (
                          <div key={i} className="text-center">
                            <div className="text-xs text-gray-600">{i}시</div>
                            <div className="mt-1 bg-gray-200 rounded h-4"></div>
                            <div className="text-xs text-gray-800 font-medium mt-1">0</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audience' && (
              <div className="space-y-6">
                {/* 사용자 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 사용자</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.users?.totalUsers?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-600">신규 사용자</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.users?.newUsers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-600">재방문자</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.users?.returningUsers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h3 className="text-sm text-gray-600">사용자 참여도</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {data?.users?.engagementRate
                        ? `${(data.users.engagementRate * 100).toFixed(1)}%`
                        : '0.0%'}
                    </p>
                  </div>
                </div>

                {/* 지역별 사용자 & 세션별 지역 분포 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 사용자</h3>
                    <div className="space-y-3">
                      {data?.users?.usersByCountry?.map((country: any, index: number) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {country.country}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {country.users.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{country.percentage}%</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">지역별 세션</h3>
                    <div className="space-y-3">
                      {data?.sessions?.sessionsByCountry?.map((country: any, index: number) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {country.country}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {country.sessions.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{country.percentage}%</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-6">
                {/* 트래픽 소스 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">오가닉 검색</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.sessionsBySource?.find((s: any) => s.source === 'google')?.sessions?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <LinkIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">직접 방문</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.sessionsBySource?.find((s: any) => s.source === '(direct)')?.sessions?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">소셜 미디어</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.sessionsBySource?.filter((s: any) => ['facebook', 'twitter', 'instagram', 'linkedin'].includes(s.source))?.reduce((sum: number, s: any) => sum + s.sessions, 0)?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <LinkIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">레퍼럴</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.sessions?.sessionsBySource?.filter((s: any) => !['google', '(direct)', 'facebook', 'twitter', 'instagram', 'linkedin'].includes(s.source))?.reduce((sum: number, s: any) => sum + s.sessions, 0)?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상위 트래픽 소스 & 매체별 분포 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 트래픽 소스</h3>
                    <div className="space-y-3">
                      {data?.sessions?.sessionsBySource?.slice(0, 10)?.map((source: any, index: number) => (
                        <div key={source.source} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-900 ml-3">
                              {source.source}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {source.sessions.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{source.percentage}%</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">매체별 세션</h3>
                    <div className="space-y-3">
                      {data?.sessions?.sessionsByMedium?.slice(0, 10)?.map((medium: any, index: number) => (
                        <div key={medium.medium} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <span className="text-sm font-medium text-gray-900 ml-3">
                              {medium.medium}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {medium.sessions.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{medium.percentage}%</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">
                          데이터를 불러오는 중...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="ml-3 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TrafficAudienceAnalytics() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">로딩 중...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthenticatedLayout>
      <TrafficAudienceContent />
    </AuthenticatedLayout>
  )
}
