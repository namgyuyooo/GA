'use client'

import { ArrowLeftIcon, CurrencyDollarIcon, TrophyIcon, ChartPieIcon, FunnelIcon } from '@heroicons/react/24/outline'
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
      setData(result)
      
      if (response.ok) {
        toast.success('전환 분석 데이터 로드 완료')
      }
    } catch (error) {
      toast.error('전환 데이터 로드 실패')
      console.error('Conversions analysis error:', error)
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
              <p className="text-gray-600 mt-1">전환 성과와 수익을 분석합니다</p>
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

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 전환수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.totalConversions?.toLocaleString() || '0'}
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
                  {data?.conversionRate ? `${(data.conversionRate * 100).toFixed(2)}%` : '0.00%'}
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
                  {data?.totalRevenue ? formatCurrency(data.totalRevenue) : '₩0'}
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
                  {data?.averageOrderValue ? formatCurrency(data.averageOrderValue) : '₩0'}
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
                {data?.conversionEvents?.map((event: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: event.color}}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
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

        {/* 전환 경로 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">전환 경로 (Top Conversion Paths)</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.conversionPaths?.map((path: any, index: number) => (
                  <div key={index} className="border-l-4 pl-4" style={{borderColor: path.color}}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{path.path}</div>
                        <div className="text-xs text-gray-500">{path.touchpoints}개 터치포인트</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{path.conversions}</div>
                        <div className="text-xs text-gray-500">{path.percentage}%</div>
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

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">전환 퍼널 분석</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.conversionFunnel?.map((stage: any, index: number) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{stage.stageName}</div>
                          <div className="text-sm text-gray-500">{stage.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{stage.users.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{stage.conversionRate}%</div>
                      </div>
                    </div>
                    {index < (data?.conversionFunnel?.length - 1) && (
                      <div className="flex justify-center my-2">
                        <div className="w-8 h-8 text-gray-400">
                          ↓
                        </div>
                      </div>
                    )}
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

        {/* UTM 캠페인 vs 오가닉 채널 분리 분석 */}
        <div className="space-y-8">
          {/* UTM 캠페인 성과 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">UTM 캠페인 전환 성과</h2>
              <p className="text-sm text-gray-600">등록된 유료 캠페인 및 UTM 태그 기반 트래픽</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data?.channelPerformance?.utmCampaigns?.length > 0 ? 
                  data.channelPerformance.utmCampaigns.map((campaign: any, index: number) => (
                    <div key={index} className="text-center p-4 border rounded-lg bg-blue-50">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{backgroundColor: `${campaign.color}20`}}>
                        <div className="w-8 h-8 rounded-full" style={{backgroundColor: campaign.color}}></div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {campaign.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{campaign.channel}</h3>
                      <p className="text-2xl font-bold mt-2" style={{color: campaign.color}}>
                        {campaign.conversions}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{campaign.conversionRate}% 전환율</p>
                      <p className="text-sm text-gray-600 mt-1">{formatCurrency(campaign.revenue)}</p>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                      등록된 UTM 캠페인이 없습니다
                    </div>
                  )
                }
              </div>
            </div>
          </div>

          {/* 오가닉 채널 성과 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">오가닉 채널 전환 성과</h2>
              <p className="text-sm text-gray-600">자연 검색, 직접 방문, 추천 트래픽</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data?.channelPerformance?.organicChannels?.length > 0 ? 
                  data.channelPerformance.organicChannels.map((channel: any, index: number) => (
                    <div key={index} className="text-center p-4 border rounded-lg bg-green-50">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{backgroundColor: `${channel.color}20`}}>
                        <div className="w-8 h-8 rounded-full" style={{backgroundColor: channel.color}}></div>
                      </div>
                      <div className="mb-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {channel.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{channel.channel}</h3>
                      <p className="text-2xl font-bold mt-2" style={{color: channel.color}}>
                        {channel.conversions}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{channel.conversionRate}% 전환율</p>
                      <p className="text-sm text-gray-600 mt-1">{formatCurrency(channel.revenue)}</p>
                    </div>
                  )) : (
                    <div className="col-span-3 text-center text-gray-500 py-8">
                      오가닉 채널 데이터를 불러오는 중...
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}