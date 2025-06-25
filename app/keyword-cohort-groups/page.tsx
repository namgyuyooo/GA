'use client'

import { PlusIcon, PencilIcon, TrashIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface KeywordGroup {
  id: string
  name: string
  description?: string
  color: string
  keywords: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function KeywordCohortGroups() {
  const [groups, setGroups] = useState<KeywordGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<KeywordGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    keywords: [] as string[]
  })
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/keyword-cohort-groups')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.groups)
      } else {
        toast.error('그룹 로드 실패')
      }
    } catch (error) {
      toast.error('그룹 로드 중 오류 발생')
      console.error('Error loading groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error('그룹명을 입력해주세요')
      return
    }

    if (formData.keywords.length === 0) {
      toast.error('최소 1개 이상의 키워드를 추가해주세요')
      return
    }

    try {
      const response = await fetch('/api/keyword-cohort-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('그룹이 생성되었습니다')
        setGroups([result.group, ...groups])
        resetForm()
        setShowCreateModal(false)
      } else {
        toast.error(result.error || '그룹 생성 실패')
      }
    } catch (error) {
      toast.error('그룹 생성 중 오류 발생')
      console.error('Error creating group:', error)
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch('/api/keyword-cohort-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGroup.id,
          ...formData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('그룹이 수정되었습니다')
        setGroups(groups.map(g => g.id === editingGroup.id ? result.group : g))
        resetForm()
        setEditingGroup(null)
      } else {
        toast.error(result.error || '그룹 수정 실패')
      }
    } catch (error) {
      toast.error('그룹 수정 중 오류 발생')
      console.error('Error updating group:', error)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('정말로 이 그룹을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/keyword-cohort-groups?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('그룹이 삭제되었습니다')
        setGroups(groups.filter(g => g.id !== id))
      } else {
        toast.error(result.error || '그룹 삭제 실패')
      }
    } catch (error) {
      toast.error('그룹 삭제 중 오류 발생')
      console.error('Error deleting group:', error)
    }
  }

  const addKeyword = () => {
    const keyword = keywordInput.trim()
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword]
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      keywords: []
    })
    setKeywordInput('')
  }

  const openEditModal = (group: KeywordGroup) => {
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color,
      keywords: [...group.keywords]
    })
    setEditingGroup(group)
  }

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TagIcon className="h-8 w-8 mr-3 text-blue-600" />
              키워드 코호트 그룹 관리
            </h1>
            <p className="text-gray-600 mt-1">검색어를 그룹으로 분류하여 코호트 분석을 수행합니다</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            새 그룹 생성
          </button>
        </div>

        {/* 그룹 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <TagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">생성된 그룹이 없습니다</div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                첫 번째 그룹을 생성해보세요
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: group.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(group)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                )}

                <div className="mb-3">
                  <div className="text-sm text-gray-500 mb-2">키워드 ({group.keywords.length}개)</div>
                  <div className="flex flex-wrap gap-1">
                    {group.keywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {group.keywords.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{group.keywords.length - 5}개 더
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    group.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {group.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 생성/수정 모달 */}
        {(showCreateModal || editingGroup) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {editingGroup ? '그룹 수정' : '새 그룹 생성'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingGroup(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    그룹명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="그룹명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="그룹 설명을 입력하세요"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    색상
                  </label>
                  <div className="flex space-x-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    키워드 *
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="키워드를 입력하고 Enter"
                    />
                    <button
                      onClick={addKeyword}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingGroup(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingGroup ? '수정' : '생성'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}