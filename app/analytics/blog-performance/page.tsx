'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { BookOpenIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface BlogPostPerformance {
  title: string
  pagePath: string
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  conversions: number
  revenue: number
  keywords: string[]
  recommendations: string[]
}

export default function BlogPerformanceAnalysisPage() {
  const [propertyId, setPropertyId] = useState('464147982') // Default property ID
  const [period, setPeriod] = useState('30daysAgo')
  const [blogPosts, setBlogPosts] = useState<BlogPostPerformance[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchBlogPerformance()
  }, [propertyId, period])

  const fetchBlogPerformance = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        propertyId,
        period,
      })

      // This is a mock API call. In a real scenario, this would call a backend API
      // that integrates with GA4 data and potentially an AI service for recommendations.
      const response = await fetch(`/api/analytics/blog-performance?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setBlogPosts(result.data)
        toast.success('블로그 성과 데이터 로드 완료')
      } else {
        toast.error(result.message || '블로그 성과 데이터 로드 실패')
        setBlogPosts(null)
      }
    } catch (error) {
      console.error('Failed to fetch blog performance data:', error)
      toast.error('블로그 성과 데이터 로드 중 오류 발생')
      setBlogPosts(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <BookOpenIcon className="h-10 w-10 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">블로그 성과 분석 및 추천</h1>
        </div>
        <p className="text-gray-600 mb-8">블로그 게시물별 성과를 분석하고, AI 기반의 최적화 및 신규 콘텐츠 추천을 받으세요.</p>

        {/* 필터 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">속성 ID</label>
            <input
              type="text"
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700">기간</label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="7daysAgo">지난 7일</option>
              <option value="30daysAgo">지난 30일</option>
              <option value="90daysAgo">지난 90일</option>
              <option value="180daysAgo">지난 180일</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="ml-4 text-gray-600">데이터 로드 중...</p>
          </div>
        ) : blogPosts ? (
          <div className="space-y-6">
            {blogPosts.map((post, index) => (
              <div key={index} className="bg-white shadow rounded-lg p-6 border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600 mb-4">경로: {post.pagePath}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="font-medium text-gray-700">조회수:</p>
                    <p className="text-lg font-semibold text-green-700">{post.pageViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">평균 세션 시간:</p>
                    <p className="text-lg font-semibold text-green-700">{post.avgSessionDuration}초</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">이탈률:</p>
                    <p className="text-lg font-semibold text-green-700">{(post.bounceRate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">전환수:</p>
                    <p className="text-lg font-semibold text-green-700">{post.conversions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">수익:</p>
                    <p className="text-lg font-semibold text-green-700">{post.revenue.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">주요 키워드:</p>
                    <p className="text-lg font-semibold text-green-700">{post.keywords.join(', ')}</p>
                  </div>
                </div>

                {post.recommendations && post.recommendations.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-md">
                    <div className="flex items-center mb-2">
                      <LightBulbIcon className="h-5 w-5 mr-2" />
                      <h4 className="font-semibold">Gemini의 추천</h4>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {post.recommendations.map((rec, recIndex) => (
                        <li key={recIndex}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">블로그 성과 데이터를 불러올 수 없습니다. 속성 ID와 기간을 확인해주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
