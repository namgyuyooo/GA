'use client'

import {
  ChartBarIcon,
  EyeIcon,
  FunnelIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  TagIcon,
  XMarkIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import SourceMediumTag from './SourceMediumTag'
import ReactMarkdown from 'react-markdown'
import AIInsightCard from './AIInsightCard'

interface TrafficSourceAnalysisProps {
  propertyId?: string
  dataMode?: 'realtime' | 'database'
}

interface TrafficSource {
  source: string
  medium: string
  campaign: string
  sessions: number
  users: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  conversions: number
  revenue: number
  isRegisteredUTM: boolean
  category: 'utm' | 'organic' | 'direct' | 'referral' | 'social' | 'paid' | 'not_set' | 'other'
  matchedUTM?: {
    name: string
    url: string
    description: string
  } | null
  topPages: Array<{
    page: string
    pageViews: number
    users: number
    avgTimeOnPage: number
  }>
}

interface KeywordGroup {
  id: string
  name: string
  keywords: string[]
  color: string
  description?: string
  createdAt?: string
}

export default function TrafficSourceAnalysis({
  propertyId = '464147982',
  dataMode,
}: TrafficSourceAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState('7daysAgo')
  const [activeTab, setActiveTab] = useState<'sources' | 'keywords' | 'pages'>('sources')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'utm' | 'non-utm'>('all')
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const [groupStats, setGroupStats] = useState<{
    [groupId: string]: { sessions: number; conversions: number }
  }>({})
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    loadTrafficData()
    loadKeywordGroups()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
    fetch('/api/settings/prompt-templates?type=traffic-insight')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setPromptTemplates(result.templates)
          const defaultTemplate = result.templates.find((t: any) => t.isDefault)
          if (defaultTemplate) setSelectedTemplate(defaultTemplate.id)
        }
      })
  }, [dateRange, propertyId, loadTrafficData, loadKeywordGroups, fetchLatestInsight])

  const loadTrafficData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/analytics/traffic-analysis?period=${dateRange}&propertyId=${propertyId}`
      )
      const result = await response.json()
      if (response.ok) {
        setData(result)
        updateKeywordGroupStats(result.data.keywords || [])
        toast.success('트래픽 분석 데이터 로드 완료')
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
      console.error('Traffic analysis load error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, propertyId])

  const loadKeywordGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/keyword-groups')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(result.groups)
        } else {
          setKeywordGroups([])
        }
      }
    } catch (error) {
      console.error('Failed to load keyword groups:', error)
      setKeywordGroups([])
    }
  }, [])

  const updateKeywordGroupStats = useCallback(
    (keywords: any[]) => {
      const stats: { [groupId: string]: { sessions: number; conversions: number } } = {}
      keywordGroups.forEach((group) => {
        const groupKeywords = keywords.filter((kw) =>
          group.keywords.some((groupKw) => kw.keyword.toLowerCase().includes(groupKw.toLowerCase()))
        )
        stats[group.id] = {
          sessions: groupKeywords.reduce((sum, kw) => sum + (kw.sessions || 0), 0),
          conversions: groupKeywords.reduce((sum, kw) => sum + (kw.conversions || 0), 0),
        }
      })
      setGroupStats(stats)
    },
    [keywordGroups]
  )

  const addKeywordGroup = async (group: {
    name: string
    color: string
    keywords: string[]
    description?: string
  }) => {
    try {
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          group,
        }),
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups((prev) => [...prev, result.group])
          toast.success('그룹이 추가되었습니다')
        } else {
          toast.error(result.message || '그룹 추가 실패')
        }
      } else {
        toast.error('그룹 추가 실패')
      }
    } catch (error) {
      toast.error('그룹 추가 중 오류 발생')
    }
  }

  const removeKeywordGroup = async (groupId: string) => {
    try {
      const group = keywordGroups.find((g) => g.id === groupId)
      if (!group) return
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          group: { id: groupId, ...group },
        }),
      })
      if (response.ok) {
        setKeywordGroups((groups) => groups.filter((g) => g.id !== groupId))
        toast.success('키워드 그룹이 삭제되었습니다')
      } else {
        toast.error('그룹 삭제 실패')
      }
    } catch (error) {
      toast.error('그룹 삭제 중 오류 발생')
    }
  }

  const addKeywordToGroup = async (groupId: string, keyword: string) => {
    try {
      const group = keywordGroups.find((g) => g.id === groupId)
      if (!group) return
      const updatedKeywords = Array.from(new Set([...group.keywords, keyword]))
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          group: { ...group, keywords: updatedKeywords },
        }),
      })
      if (response.ok) {
        setKeywordGroups((groups) =>
          groups.map((g) => (g.id === groupId ? { ...g, keywords: updatedKeywords } : g))
        )
        toast.success('키워드가 그룹에 추가되었습니다')
      } else {
        toast.error('키워드 추가 실패')
      }
    } catch (error) {
      toast.error('키워드 추가 중 오류 발생')
    }
  }

  const categorizeTrafficSources = (sources: TrafficSource[]) => {
    const categories = {
      utm: sources.filter((s) => s.isRegisteredUTM),
      organic: sources.filter((s) => s.medium === 'organic' && !s.isRegisteredUTM),
      direct: sources.filter((s) => s.medium === 'direct' || s.medium === '(none)'),
      referral: sources.filter((s) => s.medium === 'referral'),
      social: sources.filter((s) => s.medium === 'social'),
      paid: sources.filter((s) => s.medium === 'cpc' || s.medium === 'ppc'),
      not_set: sources.filter((s) => s.source === '(not set)' || s.medium === '(not set)'),
    }

    return categories
  }

  const filteredSources = data?.data?.sources
    ? sourceFilter === 'all'
      ? data.data.sources
      : sourceFilter === 'utm'
        ? data.data.sources.filter((s: TrafficSource) => s.isRegisteredUTM)
        : data.data.sources.filter((s: TrafficSource) => !s.isRegisteredUTM)
    : []

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const sources = data?.data?.sources || []
  const keywords = data?.data?.keywords || []
  const pages = data?.data?.pages || []
  const categorizedSources = categorizeTrafficSources(sources)

  const fetchLatestInsight = useCallback(async () => {
    const res = await fetch(`/api/ai-insight?type=traffic&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }, [propertyId])

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'traffic',
        propertyId,
      }

      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate
        requestBody.variables = {
          dateRange,
        }
      } else {
        requestBody.prompt =
          `다음은 트래픽 소스 분석 주요 데이터입니다.\n\n` +
          `기간: ${dateRange}\n` +
          `주요 소스/매체/캠페인별 세션, 전환 등 주요 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.`
      }

      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const result = await res.json()
      if (result.success) {
        fetchLatestInsight()
      } else {
        toast.error('AI 인사이트 생성 실패: ' + (result.error || ''))
      }
    } catch (e: any) {
      toast.error('AI 인사이트 생성 중 오류: ' + (e.message || ''))
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">트래픽 소스 분석</h1>
          <p className="text-sm text-gray-600 mt-1">
            등록된 UTM vs 자연 유입 | 페이지 경로 추적 | 키워드 그룹화
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'sources', name: '트래픽 소스', icon: GlobeAltIcon },
            { key: 'keywords', name: '키워드 분석', icon: MagnifyingGlassIcon },
            { key: 'pages', name: '페이지 경로', icon: EyeIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Traffic Sources Tab */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Source Filter */}
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'utm', label: '등록된 UTM' },
                { key: 'non-utm', label: '자연 유입' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSourceFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    sourceFilter === filter.key
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Source Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Registered UTM Campaigns */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <TagIcon className="h-5 w-5 text-green-500 mr-2" />
                    등록된 UTM 캠페인
                  </h3>
                  <span className="text-sm text-gray-500">{categorizedSources.utm.length}개</span>
                </div>
              </div>
              <div className="p-4">
                {categorizedSources.utm.length > 0 ? (
                  <div className="space-y-3">
                    {categorizedSources.utm
                      .slice(0, 5)
                      .map((source: TrafficSource, index: number) => (
                        <div key={index} className="border-l-4 border-green-400 pl-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                {source.campaign || source.source}
                                {source.matchedUTM?.name && (
                                  <span className="ml-2 text-xs text-blue-600">
                                    {source.matchedUTM.name}
                                  </span>
                                )}
                              </h4>
                              <div className="text-sm text-gray-500">
                                <SourceMediumTag source={source.source} medium={source.medium} />
                              </div>
                              {source.matchedUTM?.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {source.matchedUTM.description}
                                </div>
                              )}
                              {source.matchedUTM?.url && (
                                <div className="text-xs text-blue-500 mt-1">
                                  <a
                                    href={source.matchedUTM.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    UTM URL 바로가기
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {source.sessions.toLocaleString()} 세션
                              </div>
                              <div className="text-xs text-gray-500">{source.conversions} 전환</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <TagIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">등록된 UTM 캠페인이 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Traffic Sources */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                  전략적 트래픽 소스
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {[
                  {
                    category: 'organic',
                    label: 'Organic Search',
                    color: 'bg-green-500',
                    sources: categorizedSources.organic,
                  },
                  {
                    category: 'direct',
                    label: 'Direct Traffic',
                    color: 'bg-blue-500',
                    sources: categorizedSources.direct,
                  },
                  {
                    category: 'referral',
                    label: 'Referral',
                    color: 'bg-purple-500',
                    sources: categorizedSources.referral,
                  },
                  {
                    category: 'social',
                    label: 'Social Media',
                    color: 'bg-pink-500',
                    sources: categorizedSources.social,
                  },
                  {
                    category: 'not_set',
                    label: '(not set)',
                    color: 'bg-gray-500',
                    sources: categorizedSources.not_set,
                  },
                ].map((cat) => {
                  const totalSessions = cat.sources.reduce(
                    (sum: number, s: TrafficSource) => sum + s.sessions,
                    0
                  )
                  const totalConversions = cat.sources.reduce(
                    (sum: number, s: TrafficSource) => sum + s.conversions,
                    0
                  )

                  return (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${cat.color} rounded-full mr-3`}></div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{cat.label}</span>
                          <p className="text-xs text-gray-500">{cat.sources.length}개 소스</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {totalSessions.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{totalConversions} 전환</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Source List Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {/* Debug Info */}
            {data?.data?.debug && (
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
                <div className="text-sm text-blue-800">
                  <div className="flex items-center justify-between">
                    <span>🔍 디버깅 정보:</span>
                    <span className="text-xs">
                      총 {data.data.debug.totalSources}개 소스, 매칭된 UTM:{' '}
                      {data.data.debug.matchedUTMs}개
                    </span>
                  </div>
                  {data.data.debug.matchedUTMs === 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      등록된 UTM: {data.data.debug.registeredUTMList.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유입 소스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    세션
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이탈률
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSources
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((source: TrafficSource, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {source.isRegisteredUTM ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              <TagIcon className="h-4 w-4 text-blue-500 mr-1" />
                              {source.matchedUTM?.name || source.campaign}
                            </div>
                            <div className="text-sm text-gray-500">
                              <SourceMediumTag source={source.source} medium={source.medium} />
                            </div>
                            {source.matchedUTM?.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {source.matchedUTM.description}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              {source.source}
                            </span>
                            <SourceMediumTag source={source.source} medium={source.medium} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source.sessions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source.users.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source.conversions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(source.bounceRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-end items-center mt-4 space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50"
              >
                이전
              </button>
              <span className="text-sm">
                {currentPage} / {Math.ceil(filteredSources.length / rowsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.ceil(filteredSources.length / rowsPerPage), p + 1)
                  )
                }
                disabled={currentPage === Math.ceil(filteredSources.length / rowsPerPage)}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          {/* Keyword Groups Management */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">키워드 그룹 관리</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keywordGroups.map((group) => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${group.color} rounded-full mr-2`}></div>
                        <h4 className="text-sm font-medium text-gray-900">{group.name}</h4>
                      </div>
                      <button
                        onClick={() => removeKeywordGroup(group.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">세션</span>
                        <span className="font-medium">
                          {groupStats[group.id]?.sessions?.toLocaleString() ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">전환</span>
                        <span className="font-medium">
                          {groupStats[group.id]?.conversions ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      키워드: {group.keywords.join(', ') || '없음'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">검색어 목록</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      검색어
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세션
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전환
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      그룹 추가
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {keywords.slice(0, 20).map((keyword: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {keyword.keyword}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.sessions?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {keyword.conversions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addKeywordToGroup(e.target.value, keyword.keyword)
                              e.target.value = ''
                            }
                          }}
                          className="text-xs border-gray-300 rounded-md"
                        >
                          <option value="">그룹 선택</option>
                          {keywordGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          {/* Page Path Analysis */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">페이지 경로 추적</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      페이지 경로
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      페이지뷰
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순 사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평균 체류시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이탈률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주요 유입 소스
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.slice(0, 20).map((page: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {page.pagePath}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.pageViews?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.users?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {page.avgTimeOnPage || '0초'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {((page.bounceRate || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page.topSource || 'organic'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI 인사이트 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-primary-600" />
          <span className="font-bold text-primary-700 text-lg">AI 자동 인사이트</span>
          {latestInsight?.createdAt && (
            <span className="ml-3 text-xs text-gray-500">
              {new Date(latestInsight.createdAt).toLocaleString('ko-KR')}
            </span>
          )}
          <div className="ml-auto flex items-center space-x-2">
            {availableModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 Gemini 모델 선택"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            )}
            {promptTemplates.length > 0 && (
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 프롬프트 템플릿 선택"
              >
                <option value="">기본 프롬프트</option>
                {promptTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
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
        <div className="min-h-[60px]">
          {latestInsight?.result ? (
            <AIInsightCard result={latestInsight.result} />
          ) : (
            '아직 생성된 인사이트가 없습니다.'
          )}
        </div>
        {latestInsight?.model && (
          <div className="mt-2 text-xs text-gray-500">모델: {latestInsight.model}</div>
        )}
      </div>
    </div>
  )
}
