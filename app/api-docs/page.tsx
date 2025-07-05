'use client'

import { useState, useEffect } from 'react'
import AuthenticatedLayout from '../components/AuthenticatedLayout'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null)

  useEffect(() => {
    // Swagger JSON 파일 로드
    fetch('/swagger.json')
      .then((response) => response.json())
      .then((data) => setSwaggerSpec(data))
      .catch((error) => console.error('Failed to load swagger spec:', error))
  }, [])

  if (!swaggerSpec) {
    return (
      <AuthenticatedLayout activeTab="api-docs">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">API 문서 로드 중...</span>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout activeTab="api-docs">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">RTM AI Analytics API 문서</h1>
            <p className="mt-2 text-gray-600">
              제조업 B2B 마케팅 분석을 위한 모든 API 엔드포인트를 테스트하고 문서화합니다.
            </p>
            <div className="mt-4 flex space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-600">개발 서버: http://localhost:3000</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-gray-600">
                  프로덕션: ga-git-main-namgyuyooos-projects.vercel.app
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <SwaggerUI
            spec={swaggerSpec}
            deepLinking={true}
            displayRequestDuration={true}
            defaultModelExpandDepth={2}
            defaultModelsExpandDepth={2}
            supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
            tryItOutEnabled={true}
            docExpansion="list"
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
