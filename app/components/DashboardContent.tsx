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
  UsersIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getDataSourceInfo } from '../utils/dataExplanations'
import { CalculationTooltip, DataSourceTooltip } from './Tooltip'

interface DashboardContentProps {
  propertyId?: string
}

export default function DashboardContent({ propertyId = '464147982' }: DashboardContentProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const router = useRouter()

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

  useEffect(() => {
    loadDashboardData()
  }, [period, propertyId])

  const loadDashboardData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/dashboard/overview?period=${period}&propertyId=${propertyId}`)
      const result = await response.json()

      setData(result)

      if (response.ok) {
        toast.success('대시보드 데이터 로드 완료')
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
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
            Property ID: {propertyId} | 실시간 데이터 모니터링
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
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
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
    </div>
  )
}