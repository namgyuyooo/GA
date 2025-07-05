'use client'

import { useEffect, useState } from 'react'
import AuthenticatedLayout from '../components/AuthenticatedLayout'

export default function PropertiesPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [findingProperties, setFindingProperties] = useState(false)
  const [propertyResults, setPropertyResults] = useState<any[]>([])

  const testConnection = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/analytics/properties')
      const result = await response.json()

      if (response.ok) {
        setMessage(
          `✅ 기본 연결 성공: ${result.accounts?.length || 0}개 계정, ${result.properties?.length || 0}개 속성 발견`
        )
      } else {
        setMessage(`❌ 오류: ${result.message || result.error}`)
      }
    } catch (error) {
      setMessage(`❌ 네트워크 오류: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const findAccessibleProperties = async () => {
    setFindingProperties(true)
    setPropertyResults([])

    try {
      const response = await fetch('/api/analytics/find-properties')
      const result = await response.json()

      if (response.ok) {
        setPropertyResults(result.testResults || [])
        if (result.recommendation) {
          setMessage(`✅ 접근 가능한 GA4 속성 발견: ${result.recommendation}`)
        } else {
          setMessage('❌ 접근 가능한 GA4 속성을 찾을 수 없습니다.')
        }
      } else {
        setMessage(`❌ 속성 검색 오류: ${result.message || result.error}`)
      }
    } catch (error) {
      setMessage(`❌ 검색 중 오류: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFindingProperties(false)
    }
  }

  return (
    <AuthenticatedLayout activeTab="properties">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Google Analytics 연결 테스트</h1>

        <div className="space-y-4">
          <p className="text-gray-600">
            현재 로그인된 Google 계정으로 Analytics 데이터에 접근할 수 있는지 확인합니다.
          </p>

          <div className="flex gap-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '테스트 중...' : '기본 연결 테스트'}
            </button>

            <button
              onClick={findAccessibleProperties}
              disabled={findingProperties}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {findingProperties ? 'GA4 속성 검색 중...' : 'GA4 속성 찾기'}
            </button>
          </div>

          {message && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <pre className="whitespace-pre-wrap text-sm">{message}</pre>
            </div>
          )}

          {propertyResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">GA4 속성 테스트 결과:</h3>
              {propertyResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${result.status === 'accessible' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">속성 ID: {result.propertyId}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${result.status === 'accessible' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {result.status}
                    </span>
                  </div>
                  {result.sessions && (
                    <p className="text-sm text-gray-600 mt-1">세션 수: {result.sessions}</p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error.substring(0, 100)}...</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold mb-4">다음 단계:</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. 연결 테스트가 성공하면 실제 GA4 속성 ID를 확인</p>
              <p>2. 대시보드에서 해당 속성 ID 사용</p>
              <p>3. 만약 오류가 발생하면 Google Analytics 계정 권한 확인</p>
            </div>

            <div className="mt-6">
              <a
                href="/dashboard"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 mr-4"
              >
                대시보드로 이동
              </a>
              <a
                href="/login"
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
              >
                다시 로그인
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
