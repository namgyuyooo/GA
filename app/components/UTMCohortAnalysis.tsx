'use client'

import {
  ArrowPathIcon,
  FunnelIcon,
  UserGroupIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface UTMCohortAnalysisProps {
  propertyId?: string
  dataMode?: 'realtime' | 'database'
}

interface CohortData {
  cohortDate: string
  campaignName: string
  source: string
  medium: string
  initialUsers: number
  retentionWeek1: number
  retentionWeek2: number
  retentionWeek4: number
  retentionWeek8: number
  ltv: number
  conversions: number
}

export default function UTMCohortAnalysis({ propertyId = '464147982', dataMode = 'database' }: UTMCohortAnalysisProps) {
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')
  const [dateRange, setDateRange] = useState('7daysAgo')
  const [isLoading, setIsLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    loadCohortData()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
    fetch('/api/settings/prompt-templates?type=utm-cohort-insight')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPromptTemplates(result.templates)
          const defaultTemplate = result.templates.find((t: any) => t.isDefault)
          if (defaultTemplate) setSelectedTemplate(defaultTemplate.id)
        }
      })
  }, [propertyId, dateRange, selectedCampaign])

  const loadCohortData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/analytics/utm-cohort?propertyId=${propertyId}&period=${dateRange}&campaign=${selectedCampaign}&dataMode=${dataMode}`
      )

      if (!response.ok) {
        throw new Error('Failed to load cohort data')
      }

      const result = await response.json()
      setCohortData(result.cohorts || [])
      setCampaigns(result.campaigns || [])

      toast.success(`UTM 코호트 데이터 로드 완료 (${dataMode === 'realtime' ? '실시간' : 'DB'} 모드)`)
    } catch (error) {
      console.error('Cohort data error:', error)
      toast.error('코호트 데이터 로드 실패')

      // 데모 데이터 사용
      generateDemoData()
    } finally {
      setIsLoading(false)
    }
  }

  const generateDemoData = () => {
    const demoCampaigns = [
      { name: 'summer_sale_facebook', source: 'facebook', medium: 'social' },
      { name: 'google_ads_search', source: 'google', medium: 'cpc' },
      { name: 'email_newsletter', source: 'email', medium: 'email' },
      { name: 'naver_organic', source: 'naver', medium: 'organic' },
      { name: 'youtube_video', source: 'youtube', medium: 'social' }
    ]

    const demoData: CohortData[] = []
    const weeks = 8

    for (let week = 0; week < weeks; week++) {
      demoCampaigns.forEach((campaign, index) => {
        const cohortDate = new Date()
        cohortDate.setDate(cohortDate.getDate() - (week * 7))

        const initialUsers = Math.floor(Math.random() * 500) + 100
        const baseRetention = 0.7 - (week * 0.05) // 감소하는 리텐션

        demoData.push({
          cohortDate: cohortDate.toISOString().split('T')[0],
          campaignName: campaign.name,
          source: campaign.source,
          medium: campaign.medium,
          initialUsers,
          retentionWeek1: Math.floor(initialUsers * (baseRetention - 0.2 + Math.random() * 0.1)),
          retentionWeek2: Math.floor(initialUsers * (baseRetention - 0.3 + Math.random() * 0.1)),
          retentionWeek4: Math.floor(initialUsers * (baseRetention - 0.4 + Math.random() * 0.1)),
          retentionWeek8: Math.floor(initialUsers * (baseRetention - 0.5 + Math.random() * 0.1)),
          ltv: Math.floor((Math.random() * 50 + 10) * 100) / 100,
          conversions: Math.floor(initialUsers * (0.02 + Math.random() * 0.08))
        })
      })
    }

    setCohortData(demoData)
    setCampaigns(['all', ...demoCampaigns.map(c => c.name)])
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 0.6) return 'bg-green-500'
    if (rate >= 0.4) return 'bg-yellow-500'
    if (rate >= 0.2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const filteredData = selectedCampaign === 'all'
    ? cohortData
    : cohortData.filter(item => item.campaignName === selectedCampaign)

  const campaignSummary = filteredData.reduce((acc, item) => {
    const key = `${item.campaignName}-${item.source}-${item.medium}`
    if (!acc[key]) {
      acc[key] = {
        campaignName: item.campaignName,
        source: item.source,
        medium: item.medium,
        totalUsers: 0,
        totalConversions: 0,
        avgLTV: 0,
        avgRetentionWeek1: 0,
        avgRetentionWeek4: 0,
        count: 0
      }
    }

    acc[key].totalUsers += item.initialUsers
    acc[key].totalConversions += item.conversions
    acc[key].avgLTV += item.ltv
    acc[key].avgRetentionWeek1 += item.retentionWeek1 / item.initialUsers
    acc[key].avgRetentionWeek4 += item.retentionWeek4 / item.initialUsers
    acc[key].count += 1

    return acc
  }, {} as any)

  Object.values(campaignSummary).forEach((summary: any) => {
    summary.avgLTV /= summary.count
    summary.avgRetentionWeek1 /= summary.count
    summary.avgRetentionWeek4 /= summary.count
  })

  // 인사이트 조회
  const fetchLatestInsight = async () => {
    const res = await fetch(`/api/ai-insight?type=utm-cohort&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'utm-cohort',
        propertyId
      }

      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate
        requestBody.variables = {
          dateRange,
          selectedCampaign
        }
      } else {
        requestBody.prompt = `다음은 UTM 코호트 분석 주요 데이터입니다.\n\n` +
          `기간: ${dateRange}\n` +
          `캠페인: ${selectedCampaign}\n` +
          `주요 리텐션, 전환, LTV 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.`
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">UTM 캠페인 코호트 분석</h1>
          <p className="text-sm text-gray-600 mt-1">
            UTM 캠페인별 사용자 리텐션 및 생애가치 분석 | {dataMode === 'realtime' ? '실시간' : 'DB'} 데이터 모드
            {dataMode === 'database' && cohortData.length > 0 && (
              <span className="ml-2 text-gray-500">
                (데이터 시점: {new Date().toLocaleString('ko-KR')})
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="7daysAgo">최근 7일</option>
            <option value="30daysAgo">최근 30일</option>
            <option value="60daysAgo">최근 60일</option>
            <option value="90daysAgo">최근 90일</option>
          </select>

          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            <option value="all">모든 캠페인</option>
            {campaigns.filter(c => c !== 'all').map((campaign) => (
              <option key={campaign} value={campaign}>{campaign}</option>
            ))}
          </select>

          <button
            onClick={loadCohortData}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* Campaign Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(campaignSummary).map((summary: any, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {summary.campaignName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {summary.source} / {summary.medium}
                  </p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">총 사용자</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {summary.totalUsers.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">총 전환</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {summary.totalConversions.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">평균 LTV</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    ${summary.avgLTV.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">4주 리텐션</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {(summary.avgRetentionWeek4 * 100).toFixed(1)}%
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cohort Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">코호트 리텐션 테이블</h3>
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코호트 날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    초기 사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    1주 리텐션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    2주 리텐션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    4주 리텐션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    8주 리텐션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LTV
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((cohort, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.cohortDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cohort.campaignName}</div>
                      <div className="text-sm text-gray-500">{cohort.source} / {cohort.medium}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cohort.initialUsers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getRetentionColor(cohort.retentionWeek1 / cohort.initialUsers)}`}></div>
                        <span className="text-sm text-gray-900">
                          {((cohort.retentionWeek1 / cohort.initialUsers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getRetentionColor(cohort.retentionWeek2 / cohort.initialUsers)}`}></div>
                        <span className="text-sm text-gray-900">
                          {((cohort.retentionWeek2 / cohort.initialUsers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getRetentionColor(cohort.retentionWeek4 / cohort.initialUsers)}`}></div>
                        <span className="text-sm text-gray-900">
                          {((cohort.retentionWeek4 / cohort.initialUsers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getRetentionColor(cohort.retentionWeek8 / cohort.initialUsers)}`}></div>
                        <span className="text-sm text-gray-900">
                          {((cohort.retentionWeek8 / cohort.initialUsers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${cohort.ltv.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-end items-center mt-4 space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-50">이전</button>
              <span className="text-sm">{currentPage} / {Math.ceil(filteredData.length / rowsPerPage)}</span>
              <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(filteredData.length / rowsPerPage)} className="px-2 py-1 text-sm border rounded disabled:opacity-50">다음</button>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">인사이트</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(() => {
              // 실제 데이터 기반 인사이트 생성
              if (filteredData.length === 0) {
                return (
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h4 className="text-sm font-medium text-gray-900">데이터 없음</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      분석할 코호트 데이터가 없습니다.
                    </p>
                  </div>
                )
              }

              // 최고 성과 캠페인 찾기
              const bestRetention = filteredData.reduce((best, current) => {
                const currentRetention = current.retentionWeek4 / current.initialUsers
                const bestRetention = best.retentionWeek4 / best.initialUsers
                return currentRetention > bestRetention ? current : best
              })

              // 최고 LTV 캠페인 찾기
              const bestLTV = filteredData.reduce((best, current) => 
                current.ltv > best.ltv ? current : best
              )

              // 평균 LTV 계산
              const avgLTV = filteredData.reduce((sum, item) => sum + item.ltv, 0) / filteredData.length

              return (
                <>
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h4 className="text-sm font-medium text-gray-900">최고 성과 캠페인</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {bestRetention.campaignName} ({bestRetention.source}/{bestRetention.medium})이 가장 높은 4주 리텐션률({((bestRetention.retentionWeek4 / bestRetention.initialUsers) * 100).toFixed(1)}%)을 기록
                    </p>
                  </div>
                  <div className="border-l-4 border-green-400 pl-4">
                    <h4 className="text-sm font-medium text-gray-900">LTV 최적화 기회</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      {bestLTV.campaignName}의 LTV(${bestLTV.ltv.toFixed(2)})가 평균(${avgLTV.toFixed(2)}) 대비 {((bestLTV.ltv / avgLTV - 1) * 100).toFixed(1)}% 높아 추가 투자 권장
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* AI 인사이트 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-primary-600" />
          <span className="font-bold text-primary-700 text-lg">AI 자동 인사이트</span>
          {latestInsight?.createdAt && (
            <span className="ml-3 text-xs text-gray-500">{new Date(latestInsight.createdAt).toLocaleString('ko-KR')}</span>
          )}
          <div className="ml-auto flex items-center space-x-2">
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
            {promptTemplates.length > 0 && (
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 프롬프트 템플릿 선택"
              >
                <option value="">기본 프롬프트</option>
                {promptTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleGenerateInsight}
              disabled={insightLoading || !selectedModel}
              className="inline-flex items-center px-3 py-1 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {insightLoading ? 'AI 분석 중...' : 'AI 인사이트'}
            </button>
          </div>
        </div>
        <div className="whitespace-pre-line text-gray-800 text-sm min-h-[60px]">
          {latestInsight?.result ? latestInsight.result : '아직 생성된 인사이트가 없습니다.'}
        </div>
        {latestInsight?.model && (
          <div className="mt-2 text-xs text-gray-500">모델: {latestInsight.model}</div>
        )}
      </div>
    </div>
  )
}