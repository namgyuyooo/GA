'use client'

import {
  ArrowPathIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FireIcon,
  InformationCircleIcon,
  TagIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface IntegratedDashboardProps {
  propertyId?: string
}

export default function IntegratedDashboard({ propertyId = '464147982' }: IntegratedDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  useEffect(() => {
    loadDashboardData()
  }, [period, propertyId])

  const loadDashboardData = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/dashboard/overview?period=${period}&propertyId=${propertyId}`)
      const result = await response.json()

      setData(result.data)

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

  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatPercentage = (num: number): string => {
    return (num * 100).toFixed(1) + '%'
  }

  const formatCurrency = (num: number): string => {
    return '$' + num.toLocaleString()
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
    if (change < 0) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
    return <div className="w-4 h-4" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">통합 대시보드 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 통합 대시보드</h1>
              <p className="mt-2 text-gray-600">UTM 캠페인 성과와 웹사이트 분석의 모든 것</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7daysAgo">최근 7일</option>
                <option value="30daysAgo">최근 30일</option>
                <option value="90daysAgo">최근 90일</option>
              </select>
              <button
                onClick={refreshDashboard}
                disabled={refreshing}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 주요 KPI 카드 */}
        {data?.kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">총 세션</p>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(data.kpis.totalSessions)}</p>
                  <div className="flex items-center mt-1">
                    {getChangeIcon(data.changes.sessions)}
                    <span className={`text-sm ml-1 ${getChangeColor(data.changes.sessions)}`}>
                      {Math.abs(data.changes.sessions)}%
                    </span>
                  </div>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">총 사용자</p>
                  <p className="text-2xl font-bold text-green-900">{formatNumber(data.kpis.totalUsers)}</p>
                  <div className="flex items-center mt-1">
                    {getChangeIcon(data.changes.users)}
                    <span className={`text-sm ml-1 ${getChangeColor(data.changes.users)}`}>
                      {Math.abs(data.changes.users)}%
                    </span>
                  </div>
                </div>
                <EyeIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="card bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">페이지뷰</p>
                  <p className="text-2xl font-bold text-purple-900">{formatNumber(data.kpis.pageViews)}</p>
                  <div className="flex items-center mt-1">
                    {getChangeIcon(data.changes.pageViews)}
                    <span className={`text-sm ml-1 ${getChangeColor(data.changes.pageViews)}`}>
                      {Math.abs(data.changes.pageViews)}%
                    </span>
                  </div>
                </div>
                <ChartBarIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">전환율</p>
                  <p className="text-2xl font-bold text-orange-900">{formatPercentage(data.kpis.conversionRate)}</p>
                  <div className="flex items-center mt-1">
                    {getChangeIcon(data.changes.conversionRate)}
                    <span className={`text-sm ml-1 ${getChangeColor(data.changes.conversionRate)}`}>
                      {Math.abs(data.changes.conversionRate)}%
                    </span>
                  </div>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 실시간 현황 */}
            {data?.realTimeData && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">🔴 실시간 현황</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-3xl font-bold text-green-600 mb-2">{data.realTimeData.activeUsers}</p>
                    <p className="text-sm text-gray-600">현재 활성 사용자</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">활성 페이지</h4>
                    <div className="space-y-1">
                      {data.realTimeData.activePages.slice(0, 3).map((page: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">{page.page}</span>
                          <span className="font-medium">{page.users}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 상위 캠페인 성과 */}
            {data?.topCampaigns && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 상위 UTM 캠페인 성과</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-500">캠페인</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">세션</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">전환</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">전환율</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">ROI</th>
                        <th className="text-left py-2 text-sm font-medium text-gray-500">변화</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.topCampaigns.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((campaign: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900">{campaign.campaign}</p>
                              <p className="text-sm text-gray-500">{campaign.source} / {campaign.medium}</p>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-900">{formatNumber(campaign.sessions)}</td>
                          <td className="py-3 text-sm text-gray-900">{campaign.conversions}</td>
                          <td className="py-3 text-sm text-gray-900">{formatPercentage(campaign.conversionRate)}</td>
                          <td className="py-3 text-sm font-medium text-green-600">{campaign.roi.toFixed(2)}x</td>
                          <td className="py-3">
                            <div className="flex items-center">
                              {getChangeIcon(campaign.change)}
                              <span className={`text-sm ml-1 ${getChangeColor(campaign.change)}`}>
                                {Math.abs(campaign.change)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  <div className="flex justify-end items-center mt-4 space-x-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-50">이전</button>
                    <span className="text-sm">{currentPage} / {Math.ceil(data.topCampaigns.length / rowsPerPage)}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.topCampaigns.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(data.topCampaigns.length / rowsPerPage)} className="px-2 py-1 text-sm border rounded disabled:opacity-50">다음</button>
                  </div>
                </div>
              </div>
            )}

            {/* 상위 페이지 성과 */}
            {data?.topPages && (
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📄 상위 페이지 성과</h3>
                <div className="space-y-3">
                  {data.topPages.map((page: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{page.title}</h4>
                        <span className="text-sm text-gray-500">{formatNumber(page.pageViews)} 조회</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{page.page}</p>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">평균 체류시간:</span>
                          <span className="ml-1 font-medium">{page.avgTimeOnPage}초</span>
                        </div>
                        <div>
                          <span className="text-gray-500">바운스율:</span>
                          <span className="ml-1 font-medium">{formatPercentage(page.bounceRate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">전환:</span>
                          <span className="ml-1 font-medium">{page.conversions}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">전환율:</span>
                          <span className="ml-1 font-medium text-green-600">{formatPercentage(page.conversionRate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-8">
            {/* 빠른 액세스 메뉴 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 액세스</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/utm-builder" className="p-3 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <TagIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-blue-900">UTM 빌더</p>
                </Link>
                <Link href="/advanced-analytics" className="p-3 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <ChartBarIcon className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-purple-900">고급 분석</p>
                </Link>
                <Link href="/reports" className="p-3 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <CalendarDaysIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-900">보고서</p>
                </Link>
                <Link href="/campaign-manager" className="p-3 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                  <FireIcon className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-orange-900">캠페인 관리</p>
                </Link>
              </div>
            </div>

            {/* 상위 검색어 */}
            {data?.topKeywords && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 상위 검색어</h3>
                <div className="space-y-3">
                  {data.topKeywords.map((keyword: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{keyword.keyword}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>순위: {keyword.position.toFixed(1)}</span>
                          <span>클릭: {keyword.clicks}</span>
                          <span>CTR: {formatPercentage(keyword.ctr)}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getChangeIcon(keyword.change)}
                        <span className={`text-sm ml-1 ${getChangeColor(keyword.change)}`}>
                          {Math.abs(keyword.change)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GTM 헬스 체크 */}
            {data?.gtmHealth && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ GTM 헬스 체크</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">전체 헬스 점수</span>
                    <span className="text-2xl font-bold text-green-600">{data.gtmHealth.healthScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${data.gtmHealth.healthScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">활성 태그:</span>
                    <span className="ml-1 font-medium">{data.gtmHealth.activeTags}/{data.gtmHealth.totalTags}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">활성 트리거:</span>
                    <span className="ml-1 font-medium">{data.gtmHealth.activeTriggers}/{data.gtmHealth.totalTriggers}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">총 변수:</span>
                    <span className="ml-1 font-medium">{data.gtmHealth.totalVariables}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">UTM 관련:</span>
                    <span className="ml-1 font-medium">{data.gtmHealth.utmRelatedItems}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 알림 및 인사이트 */}
            {data?.alerts && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 알림 및 인사이트</h3>
                <div className="space-y-3">
                  {data.alerts.map((alert: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${alert.type === 'success' ? 'bg-green-50 border-green-400' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                          'bg-blue-50 border-blue-400'
                      }`}>
                      <div className="flex items-start">
                        {alert.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3" />}
                        {alert.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />}
                        {alert.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}