'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function NoAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const testServiceAccount = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/test')
      const result = await response.json()

      if (response.ok) {
        setData(result)
        toast.success('서비스 계정 인증 성공!')
      } else {
        setError(result)
        toast.error('API 호출 실패')
      }
    } catch (err: any) {
      setError({ error: err.message })
      toast.error('네트워크 오류')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔑 서비스 계정 테스트</h1>
          <p className="text-gray-600">
            OAuth 로그인 없이 서비스 계정으로 Google API 데이터를 가져오는 테스트
          </p>
        </div>

        {/* 테스트 버튼 */}
        <div className="card mb-6">
          <div className="text-center">
            <button onClick={testServiceAccount} disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2"></div>
                  API 테스트 중...
                </>
              ) : (
                '📊 Google Analytics & Search Console 테스트'
              )}
            </button>
          </div>
        </div>

        {/* 결과 표시 */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-3">❌ 오류 발생</h3>
            <pre className="text-sm text-red-700 bg-red-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* 성공 메시지 */}
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ 서비스 계정 인증 성공!
              </h3>
              <p className="text-green-700">
                OAuth 로그인 없이 Google API에서 데이터를 성공적으로 가져왔습니다.
              </p>
            </div>

            {/* 인증 정보 */}
            {data.data?.credentials && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">🔐 서비스 계정 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">프로젝트 ID:</span>
                    <span className="ml-2 text-gray-600">{data.data.credentials.projectId}</span>
                  </div>
                  <div>
                    <span className="font-medium">서비스 계정:</span>
                    <span className="ml-2 text-gray-600 break-all">
                      {data.data.credentials.clientEmail}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* GA4 데이터 */}
            {data.data?.ga4 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📈 Google Analytics 4 데이터
                </h3>
                {data.data.ga4.rows && data.data.ga4.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            소스
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            매체
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            캠페인
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            사용자
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            세션
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            페이지뷰
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.data.ga4.rows.slice(0, 10).map((row: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.dimensionValues[0]?.value || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.dimensionValues[1]?.value || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.dimensionValues[2]?.value || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.metricValues[0]?.value || '0'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.metricValues[1]?.value || '0'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {row.metricValues[2]?.value || '0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">GA4 데이터가 없거나 접근 권한이 없습니다.</p>
                )}
              </div>
            )}

            {/* Search Console 데이터 */}
            {data.data?.searchConsole && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🔍 Search Console 데이터
                </h3>
                {data.data.searchConsole.rows && data.data.searchConsole.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            검색어
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            클릭
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            노출
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            CTR
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            평균 순위
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.data.searchConsole.rows
                          .slice(0, 10)
                          .map((row: any, index: number) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.keys[0]}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.clicks}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.impressions}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {(row.ctr * 100).toFixed(2)}%
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {row.position.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Search Console 데이터가 없거나 접근 권한이 없습니다.
                    {data.data.searchConsole.error && (
                      <span className="block mt-2 text-sm text-red-600">
                        오류: {data.data.searchConsole.error}
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Raw JSON 데이터 (개발용) */}
            <details className="card">
              <summary className="cursor-pointer font-semibold text-gray-900 mb-3">
                🔧 원본 JSON 데이터 (개발자용)
              </summary>
              <pre className="text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-8 card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 이 방식의 장점</h3>
          <ul className="text-blue-700 space-y-2">
            <li>
              • <strong>OAuth 불필요:</strong> 사용자 로그인 없이 데이터 수집
            </li>
            <li>
              • <strong>자동화 가능:</strong> 서버에서 백그라운드로 실행
            </li>
            <li>
              • <strong>안정적:</strong> 사용자 세션에 의존하지 않음
            </li>
            <li>
              • <strong>확장성:</strong> 여러 사이트의 데이터를 동시에 수집 가능
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
