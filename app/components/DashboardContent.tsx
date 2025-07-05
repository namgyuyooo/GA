'use client'

import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  SparklesIcon,
  TagIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getDataSourceInfo } from '../utils/dataExplanations'
import { CalculationTooltip, DataSourceTooltip } from './Tooltip'
import AIInsightCard from './AIInsightCard'

interface DashboardContentProps {
  propertyId?: string
}

export default function DashboardContent({
  propertyId = '464147982',
}: DashboardContentProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('7daysAgo')
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [utmCohortData, setUtmCohortData] = useState<any>(null)
  const [keywordCohortData, setKeywordCohortData] = useState<any>(null)
  const [trafficData, setTrafficData] = useState<any>(null)
  const [gtmData, setGtmData] = useState<any>(null)
  const rowsPerPage = 10
  const router = useRouter()
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const handleSessionsClick = () => router.push(`/analytics/sessions?period=${period}&propertyId=${propertyId}`)
  const handleUsersClick = () => router.push(`/analytics/users?period=${period}&propertyId=${propertyId}`)
  const handlePageViewsClick = () => router.push(`/analytics/pageviews?period=${period}&propertyId=${propertyId}`)
  const handleConversionsClick = () => router.push(`/analytics/conversions?period=${period}&propertyId=${propertyId}`)

  const navigateToAnalysisTab = (tab: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
    // Note: This only changes the URL. You might need state management to re-render content.
  }

  const fetchLatestInsight = useCallback(async () => {
    const res = await fetch(`/api/ai-insight?type=dashboard&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }, [propertyId])

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    setIsLoading(!forceRefresh) // Only show initial loading spinner
    if (forceRefresh) setRefreshing(true)

    try {
      const url = `/api/dashboard/overview?period=${period}&propertyId=${propertyId}${forceRefresh ? '&forceRefresh=true' : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setData(result)
        const message = result.fromCache
          ? `캐시된 데이터를 로드했습니다. (시점: ${new Date(result.dataTimestamp).toLocaleTimeString('ko-KR')})`
          : '새로운 데이터를 성공적으로 로드했습니다.'
        toast.success(message)
      } else {
        toast.error(result.error || '데이터 로드 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
      console.error('Dashboard load error:', err)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [period, propertyId])

  const loadAnalysisData = useCallback(async (forceRefresh = false) => {
    try {
      const refreshParam = forceRefresh ? '&forceRefresh=true' : ''
      const [utmResult, keywordResult, trafficResult, gtmResult] = await Promise.all([
        fetch(`/api/analytics/utm-cohort?period=${period}&propertyId=${propertyId}${refreshParam}`).then(res => res.json()),
        fetch(`/api/analytics/keyword-groups?period=${period}&propertyId=${propertyId}${refreshParam}`).then(res => res.json()),
        fetch(`/api/analytics/traffic-analysis?period=${period}&propertyId=${propertyId}${refreshParam}`).then(res => res.json()),
        fetch(`/api/analytics/gtm-analysis?period=${period}&propertyId=${propertyId}${refreshParam}`).then(res => res.json()),
      ])
      setUtmCohortData(utmResult)
      setKeywordCohortData(keywordResult)
      setTrafficData(trafficResult)
      setGtmData(gtmResult)
    } catch (err: any) {
      console.error('Analysis data load error:', err)
      toast.error('분석 데이터 로드 중 오류가 발생했습니다.')
    }
  }, [period, propertyId])

  useEffect(() => {
    loadDashboardData()
    loadAnalysisData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models').then(res => res.json()).then(result => {
      if (result.success) {
        setAvailableModels(result.models)
        if (result.models.length > 0) setSelectedModel(result.models[0].id)
      }
    })
    fetch('/api/settings/prompt-templates?type=weekly-report').then(res => res.json()).then(result => {
      if (result.success) {
        setPromptTemplates(result.templates)
        const defaultTemplate = result.templates.find((t: any) => t.isDefault)
        if (defaultTemplate) setSelectedTemplate(defaultTemplate.id)
      }
    })
  }, [period, propertyId, loadDashboardData, loadAnalysisData, fetchLatestInsight])

  const handleRefresh = () => {
    toast.success('최신 데이터로 새로고침합니다...')
    loadDashboardData(true)
    loadAnalysisData(true)
  }

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const kpis = data?.data?.kpis || {}
      const requestBody: any = {
        model: selectedModel,
        type: 'dashboard',
        propertyId,
        templateId: selectedTemplate || undefined,
        variables: {
          dateRange: period,
          totalSessions: kpis.totalSessions || 0,
          totalUsers: kpis.totalUsers || 0,
          totalConversions: kpis.totalConversions || 0,
        },
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

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const kpis = data?.data?.kpis || {}
  const campaigns = data?.data?.topCampaigns || []
  const realTimeData = data?.data?.realTimeData || {}
  const pages = data?.data?.topPages || []

  const getComparisonText = (p: string) => {
    if (p.includes('daysAgo')) return `전 ${p.replace('daysAgo', '')}일 대비`
    return '이전 기간 대비'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics 대시보드</h1>
          <p className="text-sm text-gray-600 mt-1">
            Property ID: {propertyId}
            {data?.dataTimestamp && (
              <span className="ml-2 text-gray-500">
                (데이터 시점: {new Date(data.dataTimestamp).toLocaleString('ko-KR')})
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="7daysAgo">최근 7일</option>
            <option value="30daysAgo">최근 30일</option>
            <option value="90daysAgo">최근 90일</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={insightLoading || !selectedModel}
            className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 disabled:opacity-50"
          >
            <CodeBracketIcon className={`h-4 w-4 mr-2`} />
            {insightLoading ? 'AI 분석 중...' : 'AI 인사이트'}
          </button>
        </div>
      </div>

      {data?.isDemoMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3"><p className="text-sm text-yellow-800">{data.message}</p></div>
          </div>
        </div>
      )}

      {/* KPI Cards & Analysis Sections ... rest of the JSX is conceptually similar */}
       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleUsersClick()}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    총 사용자
                    <DataSourceTooltip
                      title="총 사용자 데이터 소스"
                      content={`
                        <div class="space-y-2">
                          <p><strong>데이터 소스:</strong> ${getDataSourceInfo('GA4').name}</p>
                          <p><strong>계산 방법:</strong> Client ID 기반 고유 사용자 중복 제거</p>
                          <p><strong>업데이트 주기:</strong> ${getDataSourceInfo('GA4').updateFrequency}</p>
                          <p><strong>주의사항:</strong> 쿠키 삭제 시 새로운 사용자로 인식될 수 있음</p>
                        </div>
                      `}
                    >
                      <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" />
                    </DataSourceTooltip>
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {kpis.totalUsers?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +12.3%
              </span>
              <span className="text-gray-600 ml-2 flex items-center">
                {getComparisonText(period)}
                <CalculationTooltip
                  title="기간 대비 성장률 계산"
                  content={`
                    <div class="space-y-2">
                      <p><strong>계산 공식:</strong> ((현재 기간 값 - 이전 기간 값) / 이전 기간 값) × 100</p>
                      <p><strong>비교 기간:</strong> ${getComparisonText(period)}</p>
                      <p><strong>예시:</strong> 7일 선택 시 최근 7일 vs 그 이전 7일</p>
                      <p><strong>주의:</strong> 계절성과 요일별 차이를 고려해야 함</p>
                    </div>
                  `}
                >
                  <InformationCircleIcon className="h-3 w-3 ml-1 text-gray-400" />
                </CalculationTooltip>
              </span>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleSessionsClick()}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    총 세션
                    <DataSourceTooltip
                      title="세션 데이터 정보"
                      content={`
                        <div class="space-y-2">
                          <p><strong>정의:</strong> 사용자가 웹사이트에서 상호작용한 기간</p>
                          <p><strong>세션 시작:</strong> 첫 페이지 로드 또는 캠페인 매개변수 변경</p>
                          <p><strong>세션 종료:</strong> 30분 비활성, 자정, 캠페인 변경</p>
                          <p><strong>데이터 소스:</strong> ${getDataSourceInfo('GA4').name}</p>
                          <p><strong>업계 평균:</strong> 세션당 2-4페이지</p>
                        </div>
                      `}
                    >
                      <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" />
                    </DataSourceTooltip>
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {kpis.totalSessions?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +8.1%
              </span>
              <span className="text-gray-600 ml-2">{getComparisonText(period)}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handlePageViewsClick()}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    페이지뷰
                    <DataSourceTooltip
                      title="페이지뷰 데이터 정보"
                      content={`
                        <div class="space-y-2">
                          <p><strong>정의:</strong> 페이지가 브라우저에 로드된 총 횟수</p>
                          <p><strong>포함:</strong> 새로고침, 뒤로가기, 동일 페이지 재방문</p>
                          <p><strong>측정 방식:</strong> GA4 페이지뷰 이벤트 기반</p>
                          <p><strong>SPA 주의:</strong> 단일 페이지 앱은 별도 설정 필요</p>
                          <p><strong>참고:</strong> 세션당 평균 페이지뷰로 사용자 참여도 측정</p>
                        </div>
                      `}
                    >
                      <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" />
                    </DataSourceTooltip>
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {kpis.pageViews?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-red-600 font-medium flex items-center">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                -2.4%
              </span>
              <span className="text-gray-600 ml-2">{getComparisonText(period)}</span>
            </div>
          </div>
        </div>

        <div
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => handleConversionsClick()}
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center">
                    전환율
                    <CalculationTooltip
                      title="전환율 계산 방법"
                      content={`
                        <div class="space-y-2">
                          <p><strong>계산 공식:</strong> (전환 수 ÷ 세션 수) × 100</p>
                          <p><strong>전환 정의:</strong> GA4에서 설정된 전환 이벤트</p>
                          <p><strong>전환 이벤트:</strong> 구매, 가입, 문의 등 비즈니스 목표</p>
                          <p><strong>업계 평균:</strong> 전자상거래 2-3%, 리드 생성 1-5%</p>
                          <p><strong>개선 방법:</strong> 랜딩페이지 최적화, 사용자 경험 개선</p>
                        </div>
                      `}
                    >
                      <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" />
                    </CalculationTooltip>
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {((kpis.conversionRate || 0) * 100).toFixed(2)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +5.7%
              </span>
              <span className="text-gray-600 ml-2">{getComparisonText(period)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UTM 코호트 분석 */}
        <div
          className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigateToAnalysisTab('utm-cohort')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TagIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">UTM 캠페인 코호트 분석</h3>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">활성 캠페인:</span>
                <span className="font-medium text-gray-900">
                  {utmCohortData?.data?.campaigns?.length || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 세션:</span>
                <span className="font-medium text-gray-900">
                  {utmCohortData?.data?.totalSessions?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">평균 전환율:</span>
                <span className="font-medium text-gray-900">
                  {utmCohortData?.data?.avgConversionRate
                    ? `${(utmCohortData.data.avgConversionRate * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>

        {/* 키워드 코호트 분석 */}
        <div
          className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={() => navigateToAnalysisTab('keyword-cohort')}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">키워드 코호트 분석</h3>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">키워드 그룹:</span>
                <span className="font-medium text-gray-900">
                  {keywordCohortData?.data?.groups?.length || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 키워드:</span>
                <span className="font-medium text-gray-900">
                  {keywordCohortData?.data?.totalKeywords || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">평균 순위:</span>
                <span className="font-medium text-gray-900">
                  {keywordCohortData?.data?.avgRank
                    ? keywordCohortData.data.avgRank.toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>
      </div>

      {/* AI 인사이트 섹션 */}
      <div className="bg-white shadow rounded-lg p-6">
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
    </div>
  )
}
