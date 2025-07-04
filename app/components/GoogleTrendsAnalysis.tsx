'use client'

import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ClockIcon,
  MapPinIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface TrendsData {
  keyword: string
  interestOverTime: Array<{
    time: string
    value: number
  }>
  relatedQueries: {
    top: Array<{
      query: string
      value: number
    }>
    rising: Array<{
      query: string
      value: number
    }>
  }
  relatedTopics: {
    top: Array<{
      topic: string
      value: number
    }>
    rising: Array<{
      topic: string
      value: number
    }>
  }
  geoMap: Array<{
    geoCode: string
    geoName: string
    value: number
  }>
}

interface GoogleTrendsAnalysisProps {
  keyword?: string
  onKeywordChange?: (keyword: string) => void
}

export default function GoogleTrendsAnalysis({
  keyword = 'AI 제조업',
  onKeywordChange,
}: GoogleTrendsAnalysisProps) {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState(keyword)
  const [timeframe, setTimeframe] = useState('today 3-m')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    if (selectedKeyword) {
      fetchTrendsData(selectedKeyword)
    }
  }, [selectedKeyword, timeframe])

  const fetchTrendsData = useCallback(
    async (searchKeyword: string) => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/analytics/google-trends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword: searchKeyword,
            timeframe,
            geo: 'KR',
          }),
        })

        const result = await response.json()
        if (result.success) {
          setTrendsData(result.data)
          toast.success(`${searchKeyword} 트렌드 데이터 로드 완료`)
        } else {
          toast.error('트렌드 데이터 로드 실패')
        }
      } catch (error) {
        console.error('Failed to fetch trends data:', error)
        toast.error('트렌드 데이터 로드 중 오류 발생')
      } finally {
        setIsLoading(false)
      }
    },
    [timeframe]
  )

  const handleKeywordSearch = () => {
    if (searchInput.trim()) {
      setSelectedKeyword(searchInput.trim())
      if (onKeywordChange) {
        onKeywordChange(searchInput.trim())
      }
    }
  }

  const handleKeywordClick = (clickedKeyword: string) => {
    setSelectedKeyword(clickedKeyword)
    setSearchInput(clickedKeyword)
    if (onKeywordChange) {
      onKeywordChange(clickedKeyword)
    }
  }

  const formatTrendValue = (value: number) => {
    if (value === 100) return '최고'
    if (value >= 80) return '매우 높음'
    if (value >= 60) return '높음'
    if (value >= 40) return '보통'
    if (value >= 20) return '낮음'
    return '매우 낮음'
  }

  const getTrendColor = (value: number) => {
    if (value >= 80) return 'text-red-600 bg-red-50'
    if (value >= 60) return 'text-orange-600 bg-orange-50'
    if (value >= 40) return 'text-yellow-600 bg-yellow-50'
    if (value >= 20) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  const currentTrend =
    trendsData?.interestOverTime?.[trendsData.interestOverTime.length - 1]?.value || 0
  const previousTrend =
    trendsData?.interestOverTime?.[trendsData.interestOverTime.length - 7]?.value || 0
  const trendChange = currentTrend - previousTrend

  return (
    <div className="space-y-6">
      {/* 검색 헤더 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Google Trends 키워드 분석</h2>
              <p className="text-sm text-gray-500">검색 트렌드와 관련 키워드를 분석합니다</p>
            </div>
          </div>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="today 1-m">지난 1개월</option>
            <option value="today 3-m">지난 3개월</option>
            <option value="today 12-m">지난 1년</option>
            <option value="today 5-y">지난 5년</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
              placeholder="검색할 키워드를 입력하세요 (예: AI 제조업, 스마트팩토리, 자동화)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleKeywordSearch}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
            {isLoading ? '분석 중...' : '분석'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Google Trends 데이터 분석 중...</span>
          </div>
        </div>
      ) : trendsData ? (
        <>
          {/* 현재 트렌드 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <HashtagIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">현재 키워드</dt>
                      <dd className="text-lg font-medium text-gray-900">{trendsData.keyword}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">현재 인기도</dt>
                      <dd
                        className={`text-lg font-medium px-2 py-1 rounded-full text-center ${getTrendColor(currentTrend)}`}
                      >
                        {formatTrendValue(currentTrend)} ({currentTrend})
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {trendChange > 0 ? (
                      <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
                    )}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">주간 변화</dt>
                      <dd
                        className={`text-lg font-medium ${trendChange > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {trendChange > 0 ? '+' : ''}
                        {trendChange}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 시계열 트렌드 차트 (간단한 텍스트 표현) */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">검색 관심도 추이 (최근 30일)</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-6 gap-2">
                {trendsData.interestOverTime.slice(-30).map((point, index) => (
                  <div key={index} className="text-center">
                    <div
                      className={`h-16 rounded mb-1 ${getTrendColor(point.value).split(' ')[1]}`}
                      style={{ height: `${Math.max(8, point.value * 0.6)}px` }}
                      title={`${point.time}: ${point.value}`}
                    ></div>
                    <div className="text-xs text-gray-500">{new Date(point.time).getDate()}일</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 관련 검색어 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium text-gray-900">급상승 검색어</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {trendsData.relatedQueries.rising.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleKeywordClick(query.query)}
                    >
                      <span className="text-sm text-gray-900">{query.query}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-green-600">+{query.value}%</span>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <MagnifyingGlassIcon className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">인기 검색어</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {trendsData.relatedQueries.top.map((query, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleKeywordClick(query.query)}
                    >
                      <span className="text-sm text-gray-900">{query.query}</span>
                      <span className="text-xs font-medium text-blue-600">{query.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 관련 주제 및 지역별 관심도 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <HashtagIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-medium text-gray-900">관련 주제</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ...trendsData.relatedTopics.top,
                    ...trendsData.relatedTopics.rising.slice(0, 5),
                  ].map((topic, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleKeywordClick(topic.topic)}
                    >
                      <div className="text-sm font-medium text-gray-900">{topic.topic}</div>
                      <div className="text-xs text-gray-500">관심도: {topic.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-medium text-gray-900">지역별 관심도</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {trendsData.geoMap.slice(0, 8).map((geo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{geo.geoName}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${geo.value}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8">{geo.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 제조업 B2B 인사이트 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <SparklesIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  제조업 B2B 마케팅 인사이트
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>현재 트렌드 분석:</strong> '{trendsData.keyword}' 키워드는
                    {currentTrend >= 70
                      ? ' 높은 관심도를 보이고 있어 마케팅 기회가 큽니다.'
                      : currentTrend >= 40
                        ? ' 보통 수준의 관심도를 보이고 있습니다.'
                        : ' 상대적으로 낮은 관심도를 보이고 있어 니치 시장으로 접근할 수 있습니다.'}
                  </p>
                  <p>
                    <strong>급상승 키워드 활용:</strong>
                    {trendsData.relatedQueries.rising
                      .slice(0, 3)
                      .map((q) => q.query)
                      .join(', ')}{' '}
                    등의 급상승 키워드를 콘텐츠 전략에 포함하세요.
                  </p>
                  <p>
                    <strong>지역별 전략:</strong> {trendsData.geoMap[0]?.geoName}에서 가장 높은
                    관심도를 보이므로 해당 지역 타겟팅을 강화하는 것이 좋습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">트렌드 데이터 없음</h3>
            <p className="mt-1 text-sm text-gray-500">
              키워드를 검색하여 Google Trends 데이터를 확인하세요.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
