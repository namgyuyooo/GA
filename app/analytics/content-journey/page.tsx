'use client'

import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MapIcon,
  SparklesIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  TagIcon,
  KeyIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from '../../components/AuthenticatedLayout'
import AIInsightCard from '../../components/AIInsightCard'

function ContentJourneyContent() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [propertyId, setPropertyId] = useState('464147982')
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const propId = urlParams.get('propertyId') || '464147982'
      setPropertyId(propId)
    }
  }, [])

  const fetchLatestInsight = useCallback(async () => {
    const res = await fetch(`/api/ai-insight?type=content-journey&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }, [propertyId])

  const loadContentJourneyData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [blogRes, journeyRes, pageviewsRes] = await Promise.all([
        fetch(`/api/analytics/blog-performance?period=${period}&propertyId=${propertyId}`),
        fetch(`/api/analytics/user-journey?period=${period}&propertyId=${propertyId}`),
        fetch(`/api/analytics/pageviews-detail?period=${period}&propertyId=${propertyId}`),
      ])

      const [blogData, journeyData, pageviewsData] = await Promise.all([
        blogRes.json(),
        journeyRes.json(),
        pageviewsRes.json(),
      ])

      if (blogData.success && journeyData.success && pageviewsData.success) {
        setData({
          blog: blogData.data,
          journey: journeyData.data,
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
    loadContentJourneyData()
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
  }, [period, propertyId, loadContentJourneyData, fetchLatestInsight])

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody = {
        model: selectedModel,
        type: 'content-journey',
        propertyId: propertyId,
        prompt: `다음은 콘텐츠 및 사용자 여정 분석 데이터입니다.

블로그 성과:
- 총 블로그 조회수: ${data?.blog?.totalPageviews || 0}
- 평균 읽기 시간: ${data?.blog?.avgTimeOnPage || 0}초
- 상위 블로그 게시물: ${JSON.stringify(data?.blog?.topPosts?.slice(0, 5) || [])}
- 블로그 검색 키워드: ${JSON.stringify(data?.blog?.topKeywords?.slice(0, 5) || [])}

사용자 여정:
- 주요 방문 경로: ${JSON.stringify(data?.journey?.topPaths?.slice(0, 5) || [])}
- 평균 여정 길이: ${data?.journey?.avgJourneyLength || 0} 페이지
- 이탈률이 높은 페이지: ${JSON.stringify(data?.journey?.highExitPages?.slice(0, 3) || [])}

페이지 성과:
- 상위 페이지: ${JSON.stringify(data?.pageviews?.topPages?.slice(0, 5) || [])}
- 평균 체류 시간: ${data?.pageviews?.avgTimeOnPage || 0}초

콘텐츠 효과성과 사용자 여정을 분석하여 3가지 주요 인사이트와 2가지 콘텐츠 개선 제안을 한국어로 요약해주세요.`,
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
    { id: 'content', name: '콘텐츠', icon: DocumentTextIcon },
    { id: 'keywords', name: '키워드', icon: MagnifyingGlassIcon },
    { id: 'gtm', name: 'GTM 분석', icon: TagIcon },
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
                <DocumentTextIcon className="h-8 w-8 mr-3 text-purple-600" />
                콘텐츠 & 여정 분석
              </h1>
              <p className="text-gray-600 mt-1">콘텐츠 효과성과 사용자 여정을 종합 분석합니다</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      ? 'border-purple-500 text-purple-600'
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
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* 주요 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 페이지뷰</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.pageviews?.totalPageviews?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">평균 체류 시간</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.pageviews?.avgTimeOnPage
                            ? `${Math.round(data.pageviews.avgTimeOnPage / 60)}분`
                            : '0분'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <BookOpenIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">블로그 조회수</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.totalPageviews?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">평균 읽기 시간</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.avgTimeOnPage
                            ? `${Math.round(data.blog.avgTimeOnPage / 60)}분`
                            : '0분'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 블로그 & 사용자 여정 통합 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 상위 블로그 게시물 */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 블로그 게시물</h3>
                    <div className="space-y-3">
                      {data?.blog?.topPosts?.map((post: any, index: number) => (
                        <div
                          key={post.title}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded"
                        >
                          <div className="flex items-start flex-1">
                            <span className="text-sm text-gray-500 w-6 mt-1">{index + 1}</span>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {post.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{post.path}</p>
                              <p className="text-xs text-purple-600 mt-1">
                                평균 읽기 시간: {Math.round(post.avgTimeOnPage / 60)}분
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {post.pageViews.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">조회수</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-500 py-8">데이터를 불러오는 중...</div>
                      )}
                    </div>
                  </div>

                  {/* 주요 사용자 여정 */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 사용자 여정</h3>
                    <div className="space-y-4">
                      {data?.journey?.topPaths?.slice(0, 5)?.map((path: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">여정 #{index + 1}</h4>
                            <div className="text-sm text-gray-500">
                              {path.users.toLocaleString()} 사용자
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 overflow-x-auto">
                            {path.steps?.slice(0, 3)?.map((step: string, stepIndex: number) => (
                              <div
                                key={stepIndex}
                                className="flex items-center space-x-2 flex-shrink-0"
                              >
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs truncate max-w-20">
                                  {step}
                                </div>
                                {stepIndex < Math.min(path.steps.length - 1, 2) && (
                                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            )) || []}
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

            {activeTab === 'keywords' && (
              <div className="space-y-6">
                {/* 키워드 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 키워드</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.topKeywords?.length || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <KeyIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 클릭수</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.topKeywords?.reduce((sum: number, k: any) => sum + k.clicks, 0)?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">평균 순위</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.topKeywords?.reduce((sum: number, k: any) => sum + (k.position || 0), 0) / Math.max(data?.blog?.topKeywords?.length || 1, 1) || '0.0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ArrowRightIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">평균 CTR</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.blog?.topKeywords?.reduce((sum: number, k: any) => sum + (k.ctr || 0), 0) / Math.max(data?.blog?.topKeywords?.length || 1, 1) * 100 || '0.0'}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상위 키워드 & 키워드 성과 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 검색 키워드</h3>
                    <div className="space-y-3">
                      {data?.blog?.topKeywords?.slice(0, 10)?.map((keyword: any, index: number) => (
                        <div key={keyword.keyword} className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {keyword.keyword}
                              </p>
                              <p className="text-xs text-gray-500">
                                순위: {keyword.position || 'N/A'} | CTR: {((keyword.ctr || 0) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {keyword.clicks.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">클릭</div>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">키워드 코호트 분석</h3>
                    <div className="space-y-3">
                      {data?.blog?.keywordCohorts?.map((cohort: any, index: number) => (
                        <div key={cohort.keyword} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{cohort.keyword}</h4>
                            <div className="text-sm text-gray-500">
                              {cohort.users.toLocaleString()} 사용자
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-gray-500">1주</div>
                              <div className="font-medium">{cohort.retention1w}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">2주</div>
                              <div className="font-medium">{cohort.retention2w}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-500">4주</div>
                              <div className="font-medium">{cohort.retention4w}%</div>
                            </div>
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

            {activeTab === 'gtm' && (
              <div className="space-y-6">
                {/* GTM 지표 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <TagIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">총 이벤트</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.gtm?.totalEvents?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <CogIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">활성 태그</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.gtm?.activeTags?.length || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">전환 이벤트</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.gtm?.conversionEvents?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="flex items-center">
                      <ArrowRightIcon className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm text-gray-600">이벤트 전환율</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {data?.gtm?.conversionRate ? `${(data.gtm.conversionRate * 100).toFixed(1)}%` : '0.0%'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상위 이벤트 & 태그 성과 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">상위 이벤트</h3>
                    <div className="space-y-3">
                      {data?.gtm?.topEvents?.map((event: any, index: number) => (
                        <div key={event.eventName} className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {event.eventName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {event.category} | 전환: {event.isConversion ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {event.eventCount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">이벤트</div>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">GTM 태그 성과</h3>
                    <div className="space-y-3">
                      {data?.gtm?.tagPerformance?.map((tag: any, index: number) => (
                        <div key={tag.tagName} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{tag.tagName}</h4>
                            <div className="text-sm text-gray-500">
                              실행률: {tag.firingRate}%
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">타입: {tag.tagType}</span>
                            <span className="text-blue-600">{tag.fires.toLocaleString()} 실행</span>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="ml-3 text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContentJourneyAnalytics() {
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">로딩 중...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthenticatedLayout>
      <ContentJourneyContent />
    </AuthenticatedLayout>
  )
}
