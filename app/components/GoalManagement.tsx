'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface Goal {
  id: string
  name: string
  description?: string
  goalType: 'EVENT' | 'PAGE_VIEW' | 'DURATION' | 'REVENUE'
  eventName?: string
  pagePath?: string
  revenueThreshold?: number
  durationSeconds?: number
  priority: number
  isActive: boolean
  totalConversions?: number
  createdAt: string
}

interface GoalManagementProps {
  propertyId?: string
}

export default function GoalManagement({ propertyId = '464147982' }: GoalManagementProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goalType: 'EVENT' as Goal['goalType'],
    eventName: '',
    pagePath: '',
    revenueThreshold: '',
    durationSeconds: '',
    priority: 1
  })

  useEffect(() => {
    loadGoals()
  }, [propertyId])

  const loadGoals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/conversion-goals?propertyId=${propertyId}`)
      const result = await response.json()
      
      if (response.ok) {
        setGoals(result.goals || [])
      } else {
        toast.error('Goal 목록 로드 실패')
      }
    } catch (error) {
      console.error('Goal loading error:', error)
      toast.error('Goal 목록 로드 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!formData.name.trim()) {
      toast.error('Goal 이름을 입력해주세요')
      return
    }

    if (formData.goalType === 'EVENT' && !formData.eventName.trim()) {
      toast.error('이벤트명을 입력해주세요')
      return
    }

    if (formData.goalType === 'PAGE_VIEW' && !formData.pagePath.trim()) {
      toast.error('페이지 경로를 입력해주세요')
      return
    }

    try {
      const response = await fetch('/api/analytics/conversion-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          revenueThreshold: formData.revenueThreshold ? Number(formData.revenueThreshold) : null,
          durationSeconds: formData.durationSeconds ? Number(formData.durationSeconds) : null,
          propertyId
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(result.message)
        setShowCreateModal(false)
        resetForm()
        loadGoals()
      } else {
        toast.error(result.error || 'Goal 생성 실패')
      }
    } catch (error) {
      console.error('Goal creation error:', error)
      toast.error('Goal 생성 중 오류 발생')
    }
  }

  const handleUpdateGoal = async () => {
    if (!editingGoal) return

    try {
      const response = await fetch('/api/analytics/conversion-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGoal.id,
          ...formData,
          revenueThreshold: formData.revenueThreshold ? Number(formData.revenueThreshold) : null,
          durationSeconds: formData.durationSeconds ? Number(formData.durationSeconds) : null
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(result.message)
        setEditingGoal(null)
        resetForm()
        loadGoals()
      } else {
        toast.error(result.error || 'Goal 수정 실패')
      }
    } catch (error) {
      console.error('Goal update error:', error)
      toast.error('Goal 수정 중 오류 발생')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('정말로 이 Goal을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/analytics/conversion-goals?id=${goalId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(result.message)
        loadGoals()
      } else {
        toast.error(result.error || 'Goal 삭제 실패')
      }
    } catch (error) {
      console.error('Goal deletion error:', error)
      toast.error('Goal 삭제 중 오류 발생')
    }
  }

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      description: goal.description || '',
      goalType: goal.goalType,
      eventName: goal.eventName || '',
      pagePath: goal.pagePath || '',
      revenueThreshold: goal.revenueThreshold?.toString() || '',
      durationSeconds: goal.durationSeconds?.toString() || '',
      priority: goal.priority
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      goalType: 'EVENT',
      eventName: '',
      pagePath: '',
      revenueThreshold: '',
      durationSeconds: '',
      priority: 1
    })
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { label: '높음', color: 'bg-red-100 text-red-800' }
      case 2: return { label: '중간', color: 'bg-yellow-100 text-yellow-800' }
      case 3: return { label: '낮음', color: 'bg-green-100 text-green-800' }
      default: return { label: '중간', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'EVENT': return '이벤트'
      case 'PAGE_VIEW': return '페이지 조회'
      case 'DURATION': return '체류 시간'
      case 'REVENUE': return '수익'
      default: return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrophyIcon className="h-8 w-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">전환 목표 관리</h2>
            <p className="text-gray-600">분석할 전환 목표를 설정하고 관리합니다</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          새 목표 추가
        </button>
      </div>

      {/* Goals List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">목표 목록을 불러오는 중...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="p-8 text-center">
            <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 전환 목표가 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 전환 목표를 추가해보세요</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              목표 추가
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    목표명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조건
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    전환수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {goals.map((goal) => {
                  const priority = getPriorityLabel(goal.priority)
                  return (
                    <tr key={goal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{goal.name}</div>
                          {goal.description && (
                            <div className="text-sm text-gray-500">{goal.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getGoalTypeLabel(goal.goalType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {goal.goalType === 'EVENT' && goal.eventName}
                        {goal.goalType === 'PAGE_VIEW' && goal.pagePath}
                        {goal.goalType === 'DURATION' && `${goal.durationSeconds}초`}
                        {goal.goalType === 'REVENUE' && `₩${goal.revenueThreshold?.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {goal.totalConversions || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingGoal ? '전환 목표 수정' : '새 전환 목표 추가'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="예: 소개서 다운로드"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={2}
                    placeholder="목표에 대한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    목표 유형 *
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => setFormData({...formData, goalType: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="EVENT">이벤트</option>
                    <option value="PAGE_VIEW">페이지 조회</option>
                    <option value="DURATION">체류 시간</option>
                    <option value="REVENUE">수익</option>
                  </select>
                </div>

                {formData.goalType === 'EVENT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이벤트명 *
                    </label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="예: 소개서 다운로드 버튼 클릭"
                    />
                  </div>
                )}

                {formData.goalType === 'PAGE_VIEW' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      페이지 경로 *
                    </label>
                    <input
                      type="text"
                      value={formData.pagePath}
                      onChange={(e) => setFormData({...formData, pagePath: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="예: /download-complete"
                    />
                  </div>
                )}

                {formData.goalType === 'REVENUE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수익 임계값 (원)
                    </label>
                    <input
                      type="number"
                      value={formData.revenueThreshold}
                      onChange={(e) => setFormData({...formData, revenueThreshold: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="100000"
                    />
                  </div>
                )}

                {formData.goalType === 'DURATION' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      체류 시간 (초)
                    </label>
                    <input
                      type="number"
                      value={formData.durationSeconds}
                      onChange={(e) => setFormData({...formData, durationSeconds: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="300"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    우선순위
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value={1}>높음</option>
                    <option value={2}>중간</option>
                    <option value={3}>낮음</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingGoal(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  취소
                </button>
                <button
                  onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  {editingGoal ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}