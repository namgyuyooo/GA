'use client'

import {
  AdjustmentsHorizontalIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  FunnelIcon,
  InformationCircleIcon,
  MinusIcon,
  StarIcon,
  TagIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface GTMAnalysisProps {
  containerId?: string
  accountId?: string
  dataMode?: 'realtime' | 'database'
}

interface GTMTag {
  id: string
  name: string
  type: string
  status: 'active' | 'paused'
  firingTriggerId: string[]
  blockingTriggerId: string[]
  parameter: Array<{ key: string; value: string }>
  fingerprint: string
  isGoal: boolean
  goalPriority: number
  category: string
  description: string
}

interface GTMTrigger {
  id: string
  name: string
  type: string
  category: string
}

interface GTMVariable {
  id: string
  name: string
  type: string
  category: string
}

interface GTMData {
  container: {
    name: string
    containerId: string
    publicId: string
    domainName: string[]
    fingerprint: string
  }
  tags: GTMTag[]
  triggers: GTMTrigger[]
  variables: GTMVariable[]
  summary: {
    totalTags: number
    activeTags: number
    pausedTags: number
    totalTriggers: number
    totalVariables: number
    goalTags: number
  }
}

export default function GTMAnalysis({
  containerId = 'GTM-N99ZMP6T',
  accountId = '6243694530',
  dataMode = 'database',
}: GTMAnalysisProps) {
  const [data, setData] = useState<GTMData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'goals' | 'triggers'>('overview')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'priority'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  useEffect(() => {
    loadGTMData()
  }, [containerId, accountId])

  const loadGTMData = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/analytics/gtm-analysis?containerId=${containerId}&accountId=${accountId}&dataMode=${dataMode}`
      )
      const result = await response.json()

      if (response.ok) {
        const gtmData = result.data as GTMData
        setData(gtmData)
        // 기존 Goal 설정 로드
        const existingGoals = new Set(
          gtmData.tags.filter((tag: GTMTag) => tag.isGoal).map((tag: GTMTag) => tag.id)
        )
        setSelectedGoals(existingGoals)
        toast.success(
          `GTM 분석 데이터 로드 완료 (${dataMode === 'realtime' ? '실시간' : 'DB'} 모드)`
        )
      } else {
        if (result.needsSetup) {
          toast.error('GTM 설정이 필요합니다. 설정 페이지에서 GTM 정보를 입력해주세요.')
        } else {
          toast.error(`GTM 데이터 로드 실패: ${result.message || '알 수 없는 오류'}`)
        }
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
      console.error('GTM Analysis load error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [containerId, accountId, dataMode])

  const toggleGoal = (tagId: string) => {
    const newSelectedGoals = new Set(selectedGoals)
    if (newSelectedGoals.has(tagId)) {
      newSelectedGoals.delete(tagId)
    } else {
      newSelectedGoals.add(tagId)
    }
    setSelectedGoals(newSelectedGoals)

    // 태그 데이터 업데이트
    if (data) {
      const updatedTags = data.tags.map((tag) => ({
        ...tag,
        isGoal: newSelectedGoals.has(tag.id),
        goalPriority: newSelectedGoals.has(tag.id)
          ? Array.from(newSelectedGoals).indexOf(tag.id) + 1
          : 0,
      }))

      setData({
        ...data,
        tags: updatedTags,
        summary: {
          ...data.summary,
          goalTags: newSelectedGoals.size,
        },
      })

      toast.success(
        newSelectedGoals.has(tagId) ? 'Goal로 추가되었습니다' : 'Goal에서 제거되었습니다'
      )
    }
  }

  const saveGoalSettings = async () => {
    if (!data) return

    setIsLoading(true)
    try {
      const goalData = {
        accountId: accountId,
        containerId: containerId,
        goals: data.tags
          .filter((tag) => selectedGoals.has(tag.id))
          .map((tag) => ({
            tagId: tag.id,
            name: tag.name,
            type: tag.type,
          })),
      }

      const response = await fetch('/api/analytics/gtm-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      })

      if (response.ok) {
        toast.success(`${selectedGoals.size}개의 Goal이 저장되었습니다`)
        // 저장 후 데이터 다시 로드
        await loadGTMData()
      } else {
        const errorData = await response.json()
        toast.error(`Goal 설정 저장에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      toast.error('Goal 설정 저장 중 오류가 발생했습니다.')
      console.error('Save goal settings error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      analytics: 'bg-blue-100 text-blue-800',
      advertising: 'bg-green-100 text-green-800',
      conversion: 'bg-purple-100 text-purple-800',
      interaction: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800',
      tracking: 'bg-red-100 text-red-800',
      other: 'bg-indigo-100 text-indigo-800',
    }
    return colors[category] || colors.other
  }

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-red-500" />
    )
  }

  const filteredTags =
    data?.tags
      .filter((tag) => filterCategory === 'all' || tag.category === filterCategory)
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name)
        } else if (sortBy === 'type') {
          comparison = a.type.localeCompare(b.type)
        } else if (sortBy === 'priority') {
          comparison = (b.goalPriority || 0) - (a.goalPriority || 0)
        }
        return sortOrder === 'asc' ? comparison : -comparison
      }) || []

  const goalTags = filteredTags.filter((tag) => selectedGoals.has(tag.id))

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">GTM 설정이 필요합니다</h3>
        <p className="mt-1 text-sm text-gray-500">
          설정 페이지에서 GTM_ACCOUNT_ID, GTM_PUBLIC_ID를 입력해주세요.
          <br />
          서비스 계정 파일은 secrets/ga-auto-464002-672370fda082.json에서 자동으로 로드됩니다.
        </p>
        <div className="mt-4">
          <a
            href="/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            설정 페이지로 이동
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Tag Manager 분석</h1>
          <p className="text-sm text-gray-600 mt-1">
            컨테이너: {data.container.publicId} | {data.container.name} |{' '}
            {dataMode === 'realtime' ? '실시간' : 'DB'} 데이터 모드
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={saveGoalSettings}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <StarIcon className="h-4 w-4 mr-2" />
            Goal 설정 저장
          </button>
        </div>
      </div>

      {/* Container Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">컨테이너 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.summary.totalTags}</div>
            <div className="text-sm text-gray-500">총 태그</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data.summary.activeTags}</div>
            <div className="text-sm text-gray-500">활성 태그</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.summary.goalTags}</div>
            <div className="text-sm text-gray-500">Goal 태그</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{data.summary.totalTriggers}</div>
            <div className="text-sm text-gray-500">총 트리거</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>도메인:</strong> {data.container.domainName.join(', ')}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', name: '태그 목록', icon: TagIcon },
            { key: 'triggers', name: '트리거 목록', icon: FunnelIcon },
            { key: 'tags', name: '상세 분석', icon: AdjustmentsHorizontalIcon },
            { key: 'goals', name: 'Goal 관리', icon: StarIcon },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="border-gray-300 rounded-md text-sm"
              >
                <option value="all">모든 카테고리</option>
                <option value="analytics">Analytics</option>
                <option value="advertising">Advertising</option>
                <option value="conversion">Conversion</option>
                <option value="interaction">Interaction</option>
                <option value="custom">Custom</option>
                <option value="tracking">Tracking</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="border-gray-300 rounded-md text-sm"
              >
                <option value="name">이름</option>
                <option value="type">타입</option>
                <option value="priority">Goal 우선순위</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  setCurrentPage(1)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {sortOrder === 'asc' ? (
                  <ArrowUpIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Tags List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Goal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    태그 이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTags
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((tag) => (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleGoal(tag.id)}
                          className={`p-1 rounded-full ${
                            selectedGoals.has(tag.id)
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <StarIcon
                            className={`h-5 w-5 ${selectedGoals.has(tag.id) ? 'fill-current' : ''}`}
                          />
                        </button>
                        {selectedGoals.has(tag.id) && (
                          <span className="ml-1 text-xs text-yellow-600 font-medium">
                            #{tag.goalPriority}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                        <div className="text-xs text-gray-500">ID: {tag.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{tag.type}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tag.category)}`}
                        >
                          {tag.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(tag.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {tag.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{tag.description}</td>
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
                {currentPage} / {Math.ceil(filteredTags.length / rowsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.ceil(filteredTags.length / rowsPerPage), p + 1)
                  )
                }
                disabled={currentPage === Math.ceil(filteredTags.length / rowsPerPage)}
                className="px-2 py-1 text-sm border rounded disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Triggers Tab */}
      {activeTab === 'triggers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    트리거 이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.triggers.map((trigger) => (
                  <tr key={trigger.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trigger.name}</div>
                      <div className="text-xs text-gray-500">ID: {trigger.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{trigger.type}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(trigger.category)}`}
                      >
                        {trigger.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tags Detail Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tags by Category */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리별 태그 분포</h3>
              <div className="space-y-3">
                {Object.entries(
                  data.tags.reduce((acc: any, tag) => {
                    acc[tag.category] = (acc[tag.category] || 0) + 1
                    return acc
                  }, {})
                ).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category)}`}
                    >
                      {category}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count as number}개</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">트리거 요약</h3>
              <div className="space-y-3">
                {Object.entries(
                  data.triggers.reduce((acc: any, trigger) => {
                    acc[trigger.category] = (acc[trigger.category] || 0) + 1
                    return acc
                  }, {})
                ).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{category}</span>
                    <span className="text-sm font-medium text-gray-900">{count as number}개</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">선택된 Goal 태그</h3>
              <span className="text-sm text-gray-500">{selectedGoals.size}개 선택됨</span>
            </div>

            {goalTags.length > 0 ? (
              <div className="space-y-4">
                {goalTags.map((tag, index) => (
                  <div key={tag.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mr-3">
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{tag.name}</h4>
                          <p className="text-xs text-gray-500">{tag.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(tag.category)}`}
                        >
                          {tag.category}
                        </span>
                        <button
                          onClick={() => toggleGoal(tag.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Type:</strong> {tag.type} |<strong className="ml-2">Status:</strong>{' '}
                      {tag.status} |<strong className="ml-2">Triggers:</strong>{' '}
                      {Array.isArray(tag.firingTriggerId) ? tag.firingTriggerId.length : 0}개
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">선택된 Goal이 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500">
                  태그 목록에서 별표를 클릭하여 Goal로 설정하세요.
                </p>
              </div>
            )}
          </div>

          {selectedGoals.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Goal 설정 안내:</strong> 선택된 태그들은 전환 목표로 추적됩니다.
                    우선순위는 선택한 순서대로 자동 설정되며, 언제든지 변경할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
