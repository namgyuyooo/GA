'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function PropertyCheckPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    checkProperties()
  }, [])

  const checkProperties = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/analytics/check-property')
      const result = await response.json()

      setData(result)

      if (response.ok) {
        toast.success('속성 정보 조회 완료')
      } else {
        toast.error('속성 조회 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">속성 정보 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 GA4 속성 및 권한 확인
          </h1>
          <p className="text-gray-600">
            서비스 계정의 GA4 접근 권한을 확인하고 설정하세요
          </p>
        </div>

        {/* 서비스 계정 정보 */}
        {data?.serviceAccount && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🤖 서비스 계정 정보</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">프로젝트 ID:</span>
                  <span className="ml-2 text-gray-900">{data.serviceAccount.projectId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">서비스 계정 이메일:</span>
                  <span className="ml-2 text-gray-900 break-all">{data.serviceAccount.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 현재 Property ID 테스트 결과 */}
        {data && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 현재 GA4 Property 테스트 (ID: {data.currentPropertyId})
            </h3>

            {data.testResult?.error ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="text-red-900 font-medium mb-2">❌ 접근 권한 없음</h4>
                <p className="text-red-700 text-sm mb-3">
                  서비스 계정이 이 GA4 속성에 접근할 권한이 없습니다.
                </p>
                <pre className="text-xs text-red-600 bg-red-100 p-2 rounded overflow-x-auto">
                  {data.testResult.error}
                </pre>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="text-green-900 font-medium mb-2">✅ 접근 권한 확인됨</h4>
                <p className="text-green-700 text-sm">
                  서비스 계정이 GA4 속성에 성공적으로 접근할 수 있습니다!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 사용 가능한 속성 목록 */}
        {data?.availableProperties && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 사용 가능한 GA4 속성</h3>

            {data.availableProperties.error ? (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-700 text-sm">
                  Admin API 접근 권한이 없어 속성 목록을 가져올 수 없습니다.
                  직접 GA4에서 Property ID를 확인해주세요.
                </p>
              </div>
            ) : data.availableProperties.properties?.length > 0 ? (
              <div className="space-y-2">
                {data.availableProperties.properties.map((property: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border">
                    <div className="font-medium text-gray-900">{property.displayName}</div>
                    <div className="text-sm text-gray-600">ID: {property.name.split('/')[1]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">접근 가능한 속성이 없습니다.</p>
            )}
          </div>
        )}

        {/* 권한 설정 가이드 */}
        {data?.instructions && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🔧 권한 설정 방법</h3>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-900 mb-2">1. Google Analytics 4 권한 추가</h4>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li><a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Analytics</a> 접속</li>
                  <li><strong>관리</strong> (톱니바퀴 아이콘) 클릭</li>
                  <li><strong>속성 액세스 관리</strong> 클릭</li>
                  <li><strong>+ 사용자 추가</strong> 클릭</li>
                  <li>이메일: <code className="bg-gray-100 px-1 rounded text-xs">{data.serviceAccount?.email}</code></li>
                  <li>역할: <strong>뷰어</strong> 선택</li>
                  <li><strong>추가</strong> 클릭</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-900 mb-2">2. Search Console 권한 추가</h4>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li><a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Search Console</a> 접속</li>
                  <li>속성 선택 (rtm.ai)</li>
                  <li><strong>설정</strong> > <strong>사용자 및 권한</strong></li>
                  <li><strong>사용자 추가</strong> 클릭</li>
                  <li>이메일: <code className="bg-gray-100 px-1 rounded text-xs">{data.serviceAccount?.email}</code></li>
                  <li>권한: <strong>모든 권한</strong> 선택</li>
                  <li><strong>추가</strong> 클릭</li>
                </ol>
              </div>

              <div className="bg-yellow-100 p-4 rounded border border-yellow-300">
                <p className="text-yellow-800 text-sm">
                  <strong>⏰ 중요:</strong> 권한 추가 후 5-10분 정도 기다린 후 다시 테스트하세요.
                  Google 시스템에서 권한이 반영되는데 시간이 걸립니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 재테스트 버튼 */}
        <div className="text-center mt-8">
          <button
            onClick={checkProperties}
            disabled={isLoading}
            className="btn-primary mr-4"
          >
            {isLoading ? '확인 중...' : '🔄 다시 확인'}
          </button>

          <a
            href="/mock-test"
            className="btn-secondary"
          >
            📊 Mock 데이터로 테스트
          </a>
        </div>
      </div>
    </div>
  )
}