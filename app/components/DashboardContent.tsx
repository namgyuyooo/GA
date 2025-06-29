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
  TagIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CodeBracketIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getDataSourceInfo } from '../utils/dataExplanations'
import { CalculationTooltip, DataSourceTooltip } from './Tooltip'

interface DashboardContentProps {
  propertyId?: string
  dataMode?: 'realtime' | 'database'
}

export default function DashboardContent({ propertyId = '464147982', dataMode = 'database' }: DashboardContentProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('7daysAgo')
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [utmCohortData, setUtmCohortData] = useState<any>(null)
  const [keywordCohortData, setKeywordCohortData] = useState<any>(null)
  const [trafficData, setTrafficData] = useState<any>(null)
  const [gtmData, setGtmData] = useState<any>(null)
  const rowsPerPage = 10;
  const router = useRouter()
  const [insightLoading, setInsightLoading] = useState(false)
  const [insight, setInsight] = useState<string|null>(null)
  const [showInsight, setShowInsight] = useState(false)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // KPI 드릴다운 핸들러들
  const handleSessionsClick = () => {
    router.push(`/analytics/sessions?period=${period}&propertyId=${propertyId}`)
  }

  const handleUsersClick = () => {
    router.push(`/analytics/users?period=${period}&propertyId=${propertyId}`)
  }

  const handlePageViewsClick = () => {
    router.push(`/analytics/pageviews?period=${period}&propertyId=${propertyId}`)
  }

  const handleConversionsClick = () => {
    router.push(`/analytics/conversions?period=${period}&propertyId=${propertyId}`)
  }

  // 분석 섹션 클릭 핸들러들
  const handleUtmCohortClick = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'utm-cohort')
    window.location.href = url.toString()
  }

  const handleKeywordCohortClick = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'keyword-cohort')
    window.location.href = url.toString()
  }

  const handleTrafficAnalysisClick = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'traffic-analysis')
    window.location.href = url.toString()
  }

  const handleGtmAnalysisClick = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', 'gtm-analysis')
    window.location.href = url.toString()
  }

  // 인사이트 조회
  const fetchLatestInsight = async () => {
    const res = await fetch(`/api/ai-insight?type=dashboard&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }

  useEffect(() => {
    loadDashboardData()
    loadAnalysisData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
    fetch('/api/settings/prompt-templates?type=weekly-report')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPromptTemplates(result.templates)
          const defaultTemplate = result.templates.find((t: any) => t.isDefault)
          if (defaultTemplate) setSelectedTemplate(defaultTemplate.id)
        }
      })
  }, [period, propertyId])

  const loadDashboardData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/dashboard/overview?period=${period}&propertyId=${propertyId}&dataMode=${dataMode}`)
      const result = await response.json()

      setData(result)

      if (response.ok) {
        toast.success(`대시보드 데이터 로드 완료 (${dataMode === 'realtime' ? '실시간' : 'DB'} 모드)`)
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
      console.error('Dashboard load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalysisData = async () => {
    try {
      // UTM 코호트 데이터 로드
      const utmResponse = await fetch(`/api/analytics/utm-cohort?period=${period}&propertyId=${propertyId}&dataMode=${dataMode}`)
      const utmResult = await utmResponse.json()
      setUtmCohortData(utmResult)

      // 키워드 코호트 데이터 로드
      const keywordResponse = await fetch(`/api/analytics/keyword-groups?period=${period}&propertyId=${propertyId}&dataMode=${dataMode}`)
      const keywordResult = await keywordResponse.json()
      setKeywordCohortData(keywordResult)

      // 트래픽 소스 데이터 로드
      const trafficResponse = await fetch(`/api/analytics/traffic-analysis?period=${period}&propertyId=${propertyId}&dataMode=${dataMode}`)
      const trafficResult = await trafficResponse.json()
      setTrafficData(trafficResult)

      // GTM 데이터 로드
      const gtmResponse = await fetch(`/api/analytics/gtm-analysis?period=${period}&propertyId=${propertyId}&dataMode=${dataMode}`)
      const gtmResult = await gtmResponse.json()
      setGtmData(gtmResult)

    } catch (err: any) {
      console.error('Analysis data load error:', err)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadDashboardData(), loadAnalysisData()])
    setRefreshing(false)
  }

  // AI 인사이트 생성 핸들러
  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'dashboard',
        propertyId
      }

      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate
        requestBody.variables = {
          dateRange: period,
          totalSessions: data?.data?.kpis?.totalSessions || 0,
          totalUsers: data?.data?.kpis?.totalUsers || 0,
          totalConversions: data?.data?.kpis?.totalConversions || 0,
          avgEngagementRate: data?.data?.kpis?.avgEngagementRate || 0,
          totalClicks: data?.data?.kpis?.totalClicks || 0,
          totalImpressions: data?.data?.kpis?.totalImpressions || 0,
          avgCtr: data?.data?.kpis?.avgCtr || 0,
          avgPosition: data?.data?.kpis?.avgPosition || 0
        }
      } else {
        requestBody.prompt = `다음은 대시보드 주요 데이터입니다.\n\n` +
          `기간: ${period}\n` +
          `총 세션: ${data?.data?.kpis?.totalSessions || 0}\n` +
          `총 사용자: ${data?.data?.kpis?.totalUsers || 0}\n` +
          `총 전환: ${data?.data?.kpis?.totalConversions || 0}\n` +
          `평균 참여율: ${data?.data?.kpis?.avgEngagementRate || 0}%\n` +
          `주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.`
      }

      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const result = await res.json()
      if (result.success) {
        fetchLatestInsight()
      } else {
        toast.error('AI 인사이트 생성 실패: ' + (result.error || ''))
      }
    } catch (e:any) {
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
  const pages = data?.data?.topPages || [];

  // 기간에 따른 비교 텍스트 동적 생성
  const getComparisonText = (period: string) => {
    switch (period) {
      case '7daysAgo':
        return '전 7일 대비'
      case '30daysAgo':
        return '전월 대비'
      case '90daysAgo':
        return '전 90일 대비'
      default:
        return '전월 대비'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics 대시보드</h1>
          <p className="text-sm text-gray-600 mt-1">
            Property ID: {propertyId} | {dataMode === 'realtime' ? '실시간' : 'DB'} 데이터 모드
            {dataMode === 'database' && data?.dataTimestamp && (
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

          {/* 모델 선택 드롭다운 */}
          {availableModels.length > 0 && (
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
              title="사용할 Gemini 모델 선택"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          )}

          {promptTemplates.length > 0 && (
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
              title="사용할 프롬프트 템플릿 선택"
            >
              <option value="">기본 프롬프트</option>
              {promptTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={insightLoading || !selectedModel}
            className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm leading-4 font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <CodeBracketIcon className={`h-4 w-4 mr-2`} />
            {insightLoading ? 'AI 분석 중...' : 'AI 인사이트'}
          </button>
        </div>
      </div>

      {/* Demo Mode Alert */}
      {data?.isDemoMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                {data.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div 
          className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
          onClick={handleUsersClick}
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
          onClick={handleSessionsClick}
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
          onClick={handlePageViewsClick}
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
          onClick={handleConversionsClick}
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
        <div className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleUtmCohortClick}>
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
                  {utmCohortData?.data?.avgConversionRate ? `${(utmCohortData.data.avgConversionRate * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>

        {/* 키워드 코호트 분석 */}
        <div className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleKeywordCohortClick}>
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
                  {keywordCohortData?.data?.avgRank ? keywordCohortData.data.avgRank.toFixed(1) : '0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>

        {/* 트래픽 소스 분석 */}
        <div className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleTrafficAnalysisClick}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FunnelIcon className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">트래픽 소스 분석</h3>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">주요 소스:</span>
                <span className="font-medium text-gray-900">
                  {trafficData?.data?.sources?.length || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">유기 검색:</span>
                <span className="font-medium text-gray-900">
                  {trafficData?.data?.organicSearch?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">직접 트래픽:</span>
                <span className="font-medium text-gray-900">
                  {trafficData?.data?.directTraffic?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>

        {/* GTM 분석 */}
        <div className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleGtmAnalysisClick}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CodeBracketIcon className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Google Tag Manager 분석</h3>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">활성 태그:</span>
                <span className="font-medium text-gray-900">
                  {gtmData?.data?.tags?.length || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">트리거:</span>
                <span className="font-medium text-gray-900">
                  {gtmData?.data?.triggers?.length || 0}개
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">저장된 목표:</span>
                <span className="font-medium text-gray-900">
                  {gtmData?.data?.savedGoals?.length || 0}개
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">클릭하여 상세 분석 보기</p>
          </div>
        </div>
      </div>

      {/* Real-time and Quick Stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Real-time Users */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                실시간 사용자
                <DataSourceTooltip
                  title="실시간 사용자 데이터"
                  content={`
                    <div class="space-y-2">
                      <p><strong>정의:</strong> 현재 웹사이트에 활성 상태인 사용자</p>
                      <p><strong>활성 기준:</strong> 최근 30분 이내 상호작용</p>
                      <p><strong>업데이트:</strong> 약 60초마다 갱신</p>
                      <p><strong>데이터 소스:</strong> GA4 Real Time API</p>
                      <p><strong>활용:</strong> 콘텐츠 게시, 캠페인 런칭 효과 즉시 확인</p>
                    </div>
                  `}
                >
                  <InformationCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                </DataSourceTooltip>
              </h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">LIVE</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-green-600">
                {realTimeData.activeUsers || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">현재 온라인 사용자</p>
            </div>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">기기별 트래픽</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">데스크톱</span>
                </div>
                <span className="text-sm font-medium text-gray-900">52.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">모바일</span>
                </div>
                <span className="text-sm font-medium text-gray-900">43.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">태블릿</span>
                </div>
                <span className="text-sm font-medium text-gray-900">3.9%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">상위 국가</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🇰🇷</span>
                  <span className="text-sm text-gray-600">대한민국</span>
                </div>
                <span className="text-sm font-medium text-gray-900">68.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🇺🇸</span>
                  <span className="text-sm text-gray-600">미국</span>
                </div>
                <span className="text-sm font-medium text-gray-900">12.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🇯🇵</span>
                  <span className="text-sm text-gray-600">일본</span>
                </div>
                <span className="text-sm font-medium text-gray-900">7.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTM Campaigns and Traffic Sources */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* UTM Campaigns Performance */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                UTM 캠페인 성과
                <DataSourceTooltip
                  title="UTM 캠페인 데이터 정보"
                  content={`
                    <div class="space-y-2">
                      <p><strong>데이터 소스:</strong> GA4 + Google Sheets</p>
                      <p><strong>UTM 매개변수:</strong> utm_source, utm_medium, utm_campaign</p>
                      <p><strong>등록된 캠페인:</strong> Google Sheets에서 관리하는 공식 캠페인</p>
                      <p><strong>성과 측정:</strong> 세션, 사용자, 전환 추적</p>
                      <p><strong>기여 모델:</strong> Last-click Attribution</p>
                    </div>
                  `}
                >
                  <InformationCircleIcon className="h-4 w-4 ml-2 text-gray-400" />
                </DataSourceTooltip>
              </h3>
              <TagIcon className="h-5 w-5 text-gray-400" />
            </div>

            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign: any, index: number) => (
                  <div key={campaign.id || index} className="border-l-4 border-primary-400 pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                        <p className="text-xs text-gray-500">
                          {campaign.source} / {campaign.medium}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.sessions?.toLocaleString() || '0'} 세션
                        </div>
                        <div className="text-xs text-gray-500">
                          {campaign.conversions || 0} 전환
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">UTM 캠페인 없음</h3>
                <p className="mt-1 text-sm text-gray-500">UTM 빌더에서 새 캠페인을 만들어보세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Traffic Sources */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">트래픽 소스</h3>
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Organic Search</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">4,234</div>
                  <div className="text-xs text-gray-500">45.2%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Direct</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">2,891</div>
                  <div className="text-xs text-gray-500">30.8%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Social Media</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">1,567</div>
                  <div className="text-xs text-gray-500">16.7%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Paid Search</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">689</div>
                  <div className="text-xs text-gray-500">7.3%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">인기 페이지</h3>
            <EyeIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    페이지 경로
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    페이지뷰
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    순 사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 체류시간
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((page, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.path}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.views}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.users}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.avgTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-end items-center mt-4 space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-50">이전</button>
              <span className="text-sm">{currentPage} / {Math.ceil(pages.length / rowsPerPage)}</span>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(pages.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(pages.length / rowsPerPage)} className="px-2 py-1 text-sm border rounded disabled:opacity-50">다음</button>
            </div>
          </div>
        </div>
      </div>

      {/* AI 인사이트 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-primary-600" />
          <span className="font-bold text-primary-700 text-lg">AI 자동 인사이트</span>
          {latestInsight?.createdAt && (
            <span className="ml-3 text-xs text-gray-500">{new Date(latestInsight.createdAt).toLocaleString('ko-KR')}</span>
          )}
        </div>
        <div className="whitespace-pre-line text-gray-800 text-sm min-h-[60px]">
          {latestInsight?.result ? latestInsight.result : '아직 생성된 인사이트가 없습니다.'}
        </div>
        {latestInsight?.model && (
          <div className="mt-2 text-xs text-gray-500">모델: {latestInsight.model}</div>
        )}
      </div>
    </div>
  )
}