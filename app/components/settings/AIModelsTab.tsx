'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface ModelPriority {
  id: string
  displayName: string
  priority: number
  enabled: boolean
}

interface AvailableModel {
  id: string
  displayName: string
  description: string
  isAvailable: boolean
}

export default function AIModelsTab() {
  const [modelPriorities, setModelPriorities] = useState<ModelPriority[]>([])
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/ai-models')
      const result = await response.json()
      
      if (result.success) {
        setModelPriorities(result.config || [])
        setAvailableModels(result.availableModels || [])
      } else {
        toast.error('AI 모델 설정 로드 실패: ' + result.error)
      }
    } catch (error: any) {
      toast.error('AI 모델 설정 로드 중 오류: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelPriorities }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('AI 모델 우선순위가 저장되었습니다.')
      } else {
        toast.error('저장 실패: ' + result.error)
      }
    } catch (error: any) {
      toast.error('저장 중 오류: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addModel = (model: AvailableModel) => {
    const maxPriority = Math.max(...modelPriorities.map(p => p.priority), 0)
    const newModel: ModelPriority = {
      id: model.id,
      displayName: model.displayName,
      priority: maxPriority + 1,
      enabled: true,
    }
    setModelPriorities([...modelPriorities, newModel])
  }

  const removeModel = (modelId: string) => {
    setModelPriorities(modelPriorities.filter(p => p.id !== modelId))
  }

  const movePriority = (modelId: string, direction: 'up' | 'down') => {
    const index = modelPriorities.findIndex(p => p.id === modelId)
    if (index === -1) return

    const newPriorities = [...modelPriorities]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < newPriorities.length) {
      // 우선순위 값 교환
      const temp = newPriorities[index].priority
      newPriorities[index].priority = newPriorities[targetIndex].priority
      newPriorities[targetIndex].priority = temp

      // 배열 정렬
      newPriorities.sort((a, b) => a.priority - b.priority)
      setModelPriorities(newPriorities)
    }
  }

  const toggleEnabled = (modelId: string) => {
    setModelPriorities(
      modelPriorities.map(p =>
        p.id === modelId ? { ...p, enabled: !p.enabled } : p
      )
    )
  }

  const availableModelsToAdd = availableModels.filter(
    model => !modelPriorities.some(p => p.id === model.id)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">AI 모델 설정을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI 모델 우선순위 설정</h3>
          <p className="text-sm text-gray-500">
            AI 인사이트에서 사용할 Gemini 모델의 우선순위를 설정하세요. 상위 모델부터 시도됩니다.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadConfig}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            새로고침
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 현재 우선순위 목록 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">현재 모델 우선순위</h4>
          
          {modelPriorities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              설정된 모델이 없습니다. 아래에서 모델을 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {modelPriorities
                .sort((a, b) => a.priority - b.priority)
                .map((model, index) => (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      model.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>우선순위 {model.priority}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {model.displayName}
                        </div>
                        <div className="text-xs text-gray-500">{model.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleEnabled(model.id)}
                        className={`p-1 rounded ${
                          model.enabled ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                        }`}
                        title={model.enabled ? '비활성화' : '활성화'}
                      >
                        {model.enabled ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => movePriority(model.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="우선순위 올리기"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => movePriority(model.id, 'down')}
                        disabled={index === modelPriorities.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        title="우선순위 내리기"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => removeModel(model.id)}
                        className="p-1 rounded text-red-400 hover:text-red-600"
                        title="제거"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 사용 가능한 모델 추가 */}
      {availableModelsToAdd.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">사용 가능한 모델</h4>
            <div className="space-y-2">
              {availableModelsToAdd.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {model.displayName}
                    </div>
                    <div className="text-xs text-gray-500">{model.id}</div>
                    {model.description && (
                      <div className="text-xs text-gray-400 mt-1">{model.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => addModel(model)}
                    className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                  >
                    추가
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}