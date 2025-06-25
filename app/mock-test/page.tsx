'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function MockTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)

  // 페이지 로드 시 자동으로 Mock 데이터 로드
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/analytics/mock')
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
        toast.success('Mock 데이터 로드 완료!')
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
    } finally {
      setIsLoading(false)
    }
  }

  const testRealAPI = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/analytics/test')
      const result = await response.json()
      
      if (response.ok) {
        setData(result)
        toast.success('실제 API 연결 성공!')
      } else {
        toast.error('API 활성화가 필요합니다')
      }
    } catch (err: any) {
      toast.error('API 연결 실패')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📊 UTM Analytics Dashboard (테스트)
          </h1>
          <p className="text-gray-600">
            {data?.isMockData 
              ? '🧪 Mock 데이터로 UI 테스트 중 - Google API 활성화 후 실제 데이터로 전환됩니다'
              : '✅ 실제 Google API 데이터'
            }
          </p>
        </div>

        {/* API 설정 안내 */}
        {data?.isMockData && (
          <div className="card bg-yellow-50 border-yellow-200 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              ⚠️ Google API 활성화 필요
            </h3>
            <div className="text-yellow-800 space-y-2">
              <p>실제 데이터를 보려면 다음 API들을 활성화하세요:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a 
                  href="https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=599501499009"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-center"
                >
                  Google Analytics Data API 활성화
                </a>
                <button
                  onClick={testRealAPI}
                  disabled={isLoading}
                  className="btn-secondary"
                >
                  {isLoading ? '테스트 중...' : '실제 API 테스트'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 전체 요약 */}
        {data?.data?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900">총 사용자</h3>
              <p className="text-2xl font-bold text-blue-600">
                {data.data.summary.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="card bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-900">총 세션</h3>
              <p className="text-2xl font-bold text-green-600">
                {data.data.summary.totalSessions.toLocaleString()}
              </p>
            </div>
            <div className="card bg-purple-50 border-purple-200">
              <h3 className="font-semibold text-purple-900">총 클릭</h3>
              <p className="text-2xl font-bold text-purple-600">
                {data.data.summary.totalClicks.toLocaleString()}
              </p>
            </div>
            <div className="card bg-orange-50 border-orange-200">
              <h3 className="font-semibold text-orange-900">평균 CTR</h3>
              <p className="text-2xl font-bold text-orange-600">
                {data.data.summary.avgCTR.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UTM 캠페인 성과 */}
          {data?.data?.ga4?.rows && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🎯 UTM 캠페인 성과
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">소스</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">매체</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">캠페인</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">사용자</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">세션</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.data.ga4.rows.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{row.dimensionValues[0]?.value}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{row.dimensionValues[1]?.value}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">{row.dimensionValues[2]?.value}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{parseInt(row.metricValues[0]?.value).toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{parseInt(row.metricValues[1]?.value).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 검색 키워드 성과 */}
          {data?.data?.searchConsole?.rows && (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🔍 검색 키워드 성과
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">검색어</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">클릭</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">노출</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.data.searchConsole.rows.map((row: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate">{row.keys[0]}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.clicks}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{row.impressions.toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{(row.ctr * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{row.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 새로고침 버튼 */}
        <div className="text-center mt-8">
          <button
            onClick={loadMockData}
            disabled={isLoading}
            className="btn-secondary mr-4"
          >
            {isLoading ? '로딩 중...' : '🔄 새로고침'}
          </button>
          
          <button
            onClick={() => window.open('/utm-builder', '_blank')}
            className="btn-primary"
          >
            🔗 UTM 빌더 열기
          </button>
        </div>
      </div>
    </div>
  )
}