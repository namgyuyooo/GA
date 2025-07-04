import { ArrowLeftIcon, UsersIcon, UserPlusIcon, ArrowPathIcon, ChartPieIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export default function UsersAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')
  const [insightLoading, setInsightLoading] = useState(false)
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')

  useEffect(() => {
    loadUsersData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
  }, [period])

  const loadUsersData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/users-detail?period=${period}`)
      const result = await response.json()
      setData(result)
      
      if (response.ok) {
        toast.success('사용자 분석 데이터 로드 완료')
      }
    } catch (error) {
      toast.error('사용자 데이터 로드 실패')
      console.error('Users analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLatestInsight = async () => {
    const res = await fetch(`/api/ai-insight?type=users&propertyId=464147982`) // propertyId needs to be dynamic
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'users',
        propertyId: '464147982', // propertyId needs to be dynamic
        prompt: `다음은 사용자 분석 데이터입니다.\n\n` +
          `총 사용자: ${data?.totalUsers || 0}\n` +
          `신규 사용자: ${data?.newUsers || 0}\n` +
          `재방문 사용자: ${data?.returningUsers || 0}\n` +
          `신규 사용자 비율: ${data?.newUserRate ? (data.newUserRate * 100).toFixed(1) : '0.0'}%\n` +
          `사용자 획득 채널: ${JSON.stringify(data?.acquisitionChannels || [])}\n` +
          `신규 vs 재방문 사용자 추이: ${JSON.stringify(data?.userTypesTrend || [])}\n` +
          `사용자 참여도 (평균 참여 시간): ${data?.avgEngagementTime || 0}초\n` +
          `사용자 참여도 (참여 세션 비율): ${data?.engagedSessionsRate ? (data.engagedSessionsRate * 100).toFixed(1) : '0.0'}%\n` +
          `사용자 참여도 (세션당 이벤트): ${data?.eventsPerSession || 0}\n` +
          `사용자 참여도 (재방문율): ${data?.returnVisitorRate ? (data.returnVisitorRate * 100).toFixed(1) : '0.0'}%\n` +
          `사용자 세분화 (신규 방문자): ${data?.segmentation?.newVisitors || 0}\n` +
          `사용자 세분화 (활성 사용자): ${data?.segmentation?.activeUsers || 0}\n` +
          `사용자 세분화 (고가치 사용자): ${data?.segmentation?.highValueUsers || 0}\n` +
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
                <UsersIcon className="h-8 w-8 mr-3 text-green-600" />
                사용자 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">사용자 획득, 행동, 참여도를 분석합니다</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <ReactMarkdown>{latestInsight.result}</ReactMarkdown>
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
              <UsersIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.totalUsers?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UserPlusIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">신규 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.newUsers?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ArrowPathIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">재방문 사용자</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.returningUsers?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartPieIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">신규 사용자 비율</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.newUserRate ? `${(data.newUserRate * 100).toFixed(1)}%` : '0.0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 획득 채널 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">사용자 획득 채널</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {data?.acquisitionChannels?.map((channel: any) => (
                <div key={channel.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-3" style={{backgroundColor: channel.color}}></div>
                    <div>
                      <div className="font-medium text-gray-900">{channel.source}</div>
                      <div className="text-sm text-gray-500">{channel.medium}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{channel.users.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{channel.percentage}%</div>
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

        {/* 사용자 행동 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">신규 vs 재방문 사용자 추이</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.userTypesTrend?.map((item: any) => (
                  <div key={item.date} className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">{item.date}</div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm">신규: {item.newUsers}</span>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">재방문: {item.returningUsers}</span>
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
              <h2 className="text-lg font-semibold text-gray-900">사용자 참여도</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">평균 참여 시간</span>
                  <span className="font-semibold text-gray-900">
                    {data?.avgEngagementTime ? `${Math.round(data.avgEngagementTime / 60)}분` : '0분'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">참여 세션 비율</span>
                  <span className="font-semibold text-gray-900">
                    {data?.engagedSessionsRate ? `${(data.engagedSessionsRate * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">세션당 이벤트</span>
                  <span className="font-semibold text-gray-900">
                    {data?.eventsPerSession?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">재방문율</span>
                  <span className="font-semibold text-gray-900">
                    {data?.returnVisitorRate ? `${(data.returnVisitorRate * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 사용자 세분화 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">사용자 세분화</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">신규 방문자</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {data?.segmentation?.newVisitors || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">첫 방문 사용자</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowPathIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">활성 사용자</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {data?.segmentation?.activeUsers || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">정기 방문 사용자</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChartPieIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">고가치 사용자</h3>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {data?.segmentation?.highValueUsers || '0'}
                </p>
                <p className="text-sm text-gray-500 mt-1">높은 참여도 사용자</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}