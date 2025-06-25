'use client'

import { ArrowLeftIcon, EyeIcon, DocumentTextIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function PageViewsAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')

  useEffect(() => {
    loadPageViewsData()
  }, [period])

  const loadPageViewsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/pageviews-detail?period=${period}`)
      const result = await response.json()
      setData(result)
      
      if (response.ok) {
        toast.success('페이지뷰 분석 데이터 로드 완료')
      }
    } catch (error) {
      toast.error('페이지뷰 데이터 로드 실패')
      console.error('PageViews analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <EyeIcon className="h-8 w-8 mr-3 text-purple-600" />
                페이지뷰 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">페이지별 조회수와 사용자 행동을 분석합니다</p>
            </div>
          </div>

          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7daysAgo">지난 7일</option>
            <option value="30daysAgo">지난 30일</option>
            <option value="90daysAgo">지난 90일</option>
          </select>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 페이지뷰</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.totalPageViews?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">순 페이지뷰</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.uniquePageViews?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 페이지 체류시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.avgTimeOnPage ? `${Math.round(data.avgTimeOnPage)}초` : '0초'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">페이지별 전환율</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.pageConversionRate ? `${(data.pageConversionRate * 100).toFixed(2)}%` : '0.00%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 인기 페이지 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">인기 페이지</h2>
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
                    순 페이지뷰
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    평균 체류시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이탈률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.topPages?.map((page: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{page.path}</div>
                      <div className="text-sm text-gray-500 truncate max-w-md">{page.title}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {page.pageViews?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {page.uniquePageViews?.toLocaleString() || page.users?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {page.avgTimeOnPage ? `${Math.round(page.avgTimeOnPage)}초` : '0초'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {page.bounceRate ? `${(page.bounceRate * 100).toFixed(1)}%` : '0.0%'}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 페이지 카테고리별 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">페이지 카테고리별 조회수</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.pageCategories?.map((category: any) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-3" style={{backgroundColor: category.color}}></div>
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{category.pageViews.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{category.percentage}%</div>
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

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">페이지 성능 지표</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">평균 로딩 시간</span>
                  <span className="font-semibold text-gray-900">
                    {data?.avgLoadTime ? `${data.avgLoadTime}초` : '측정 중...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">스크롤 깊이 (평균)</span>
                  <span className="font-semibold text-gray-900">
                    {data?.avgScrollDepth ? `${data.avgScrollDepth}%` : '측정 중...'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">페이지별 이벤트 수</span>
                  <span className="font-semibold text-gray-900">
                    {data?.avgEventsPerPage?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">모바일 조회 비율</span>
                  <span className="font-semibold text-gray-900">
                    {data?.mobileViewsRate ? `${(data.mobileViewsRate * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 페이지 플로우 분석 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">페이지 플로우 분석</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <EyeIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">랜딩 페이지</h3>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {data?.flowAnalysis?.landingPages || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">진입점 페이지 수</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">중간 페이지</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {data?.flowAnalysis?.intermediatePages || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">탐색 경로 페이지</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">출구 페이지</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {data?.flowAnalysis?.exitPages || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">이탈 발생 페이지</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}