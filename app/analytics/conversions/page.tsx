'use client'

import { ArrowLeftIcon, CurrencyDollarIcon, TrophyIcon, ChartPieIcon, FunnelIcon, ExclamationTriangleIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function ConversionsAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [propertyId, setPropertyId] = useState('464147982')
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')

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
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
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

  const fetchLatestInsight = async () => {
    const res = await fetch(`/api/ai-insight?type=conversions&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'conversions',
        propertyId: propertyId,
        prompt: `다음은 전환 분석 데이터입니다.\n\n` +
          `총 전환수: ${data?.totalConversions || 0}\n` +
          `전환율: ${data?.conversionRate ? (data.conversionRate * 100).toFixed(2) : '0.00'}%\n` +
          `전환 가치: ${data?.totalRevenue || 0}\n` +
          `평균 주문 가치: ${data?.averageOrderValue || 0}\n` +
          `전환 이벤트별 성과: ${JSON.stringify(data?.conversionEvents || [])}\n` +
          `트래픽 소스별 전환 성과: ${JSON.stringify(data?.conversionPaths || [])}\n` +
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
            <Link href="/" className="mr-4">
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
            <Link href="/" className="mr-4">
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

          <div className="flex items-center space-x-3">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="7daysAgo">지난 7일</option>
              <option value="30daysAgo">지난 30일</option>
              <option value="90daysAgo">지난 90일</option>
            </select>

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
            <div className="prose prose-indigo max-w-none text-gray-800">
              <p>{latestInsight.result}</p>
            </div>
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