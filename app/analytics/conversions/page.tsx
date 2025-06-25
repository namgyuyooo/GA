'use client'

import { ArrowLeftIcon, CurrencyDollarIcon, TrophyIcon, ChartPieIcon, FunnelIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function ConversionsAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [propertyId, setPropertyId] = useState('464147982')

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlPeriod = urlParams.get('period')
      const urlPropertyId = urlParams.get('propertyId')
      
      if (urlPeriod) setPeriod(urlPeriod)
      if (urlPropertyId) setPropertyId(urlPropertyId)
    }
  }, [])

  useEffect(() => {
    loadConversionsData()
  }, [period, propertyId])

  const loadConversionsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/conversions-detail?period=${period}&propertyId=${propertyId}`)
      const result = await response.json()
      
      if (response.ok && result.success) {
        setData(result.data)
        toast.success('전환 분석 데이터 로드 완료')
      } else {
        toast.error(result.message || '전환 데이터 로드 실패')
        setData(null)
      }
    } catch (error) {
      toast.error('전환 데이터 로드 실패')
      console.error('Conversions analysis error:', error)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 mr-3 text-orange-600" />
                전환 상세 분석
              </h1>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  전환 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                <CurrencyDollarIcon className="h-8 w-8 mr-3 text-orange-600" />
                전환 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">
                전환 성과와 수익을 분석합니다
                {data.dataTimestamp && (
                  <span className="ml-2 text-gray-500">
                    (데이터 시점: {new Date(data.dataTimestamp).toLocaleString('ko-KR')})
                  </span>
                )}
              </p>
            </div>
          </div>

          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="7daysAgo">지난 7일</option>
            <option value="30daysAgo">지난 30일</option>
            <option value="90daysAgo">지난 90일</option>
          </select>
        </div>

        {/* Goal 설정 안내 */}
        {!data.hasCustomGoals && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>전환 목표 설정 안내:</strong> 현재 기본 전환 이벤트를 분석하고 있습니다. 
                  더 정확한 분석을 위해 GTM 분석 페이지에서 전환 목표를 설정해보세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 전환수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalConversions?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">전환율</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.conversionRate ? `${(data.conversionRate * 100).toFixed(2)}%` : '0.00%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartPieIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">전환 가치</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalRevenue ? formatCurrency(data.totalRevenue) : '₩0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FunnelIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 주문 가치</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.averageOrderValue ? formatCurrency(data.averageOrderValue) : '₩0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 전환 이벤트별 분석 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">전환 이벤트별 성과</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이벤트명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환 가치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    비율
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.conversionEvents?.length > 0 ? (
                  data.conversionEvents.map((event: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: event.color}}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{event.goalName}</div>
                            <div className="text-sm text-gray-500">{event.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.conversions?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.conversionRate ? `${(event.conversionRate * 100).toFixed(2)}%` : '0.00%'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.revenue ? formatCurrency(event.revenue) : '₩0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.percentage}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      전환 이벤트 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 전환 경로 분석 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">트래픽 소스별 전환 성과</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환율
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환 가치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    비율
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.conversionPaths?.length > 0 ? (
                  data.conversionPaths.map((path: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{path.channelName}</div>
                          <div className="text-sm text-gray-500">{path.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {path.conversions?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {path.conversionRate ? `${(path.conversionRate * 100).toFixed(2)}%` : '0.00%'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {path.revenue ? formatCurrency(path.revenue) : '₩0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {path.percentage}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      전환 경로 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}