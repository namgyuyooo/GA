'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface DataSourceStatus {
  name: string
  lastSync: string // Date string
  nextSync: string // Date string
  status: 'success' | 'failed' | 'syncing' | 'idle'
  message?: string
}

export default function DataManagementPage() {
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([
    {
      name: 'Google Analytics 4 (GA4)',
      lastSync: '2024-07-03 10:30:00',
      nextSync: '2024-07-04 03:00:00',
      status: 'success',
      message: '최신 데이터 동기화 완료',
    },
    {
      name: 'Google Tag Manager (GTM)',
      lastSync: '2024-07-02 18:00:00',
      nextSync: '2024-07-04 03:00:00',
      status: 'success',
      message: '태그 및 변수 정보 업데이트 완료',
    },
    {
      name: 'Google Search Console (GSC)',
      lastSync: '2024-07-03 05:00:00',
      nextSync: '2024-07-04 03:00:00',
      status: 'failed',
      message: 'API 연결 오류. 재시도 필요.',
    },
    {
      name: 'Google Sheets (UTM Campaigns)',
      lastSync: '2024-07-03 11:00:00',
      nextSync: '2024-07-04 03:00:00',
      status: 'syncing',
      message: '캠페인 데이터 동기화 중...',
    },
  ])

  const handleManualSync = async (sourceName: string) => {
    const sourceIndex = dataSources.findIndex((s) => s.name === sourceName)
    if (sourceIndex === -1) return

    const updatedSources = [...dataSources]
    updatedSources[sourceIndex] = {
      ...updatedSources[sourceIndex],
      status: 'syncing',
      message: '동기화 요청 중...',
    }
    setDataSources(updatedSources)

    toast.loading(`${sourceName} 동기화 요청 중...`)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      // In a real application, this would be an actual API call to trigger sync
      const success = Math.random() > 0.2 // 80% success rate for demo

      updatedSources[sourceIndex] = {
        ...updatedSources[sourceIndex],
        lastSync: new Date().toLocaleString(),
        status: success ? 'success' : 'failed',
        message: success ? '동기화 완료' : '동기화 실패. 다시 시도해주세요.',
      }
      setDataSources(updatedSources)
      if (success) {
        toast.success(`${sourceName} 동기화 완료!`, { id: sourceName })
      } else {
        toast.error(`${sourceName} 동기화 실패!`, { id: sourceName })
      }
    } catch (error) {
      updatedSources[sourceIndex] = {
        ...updatedSources[sourceIndex],
        status: 'failed',
        message: '네트워크 오류로 동기화 실패',
      }
      setDataSources(updatedSources)
      toast.error(`${sourceName} 동기화 중 네트워크 오류!`, { id: sourceName })
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <CloudArrowUpIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">데이터 동기화 현황판</h1>
        </div>
        <p className="text-gray-600 mb-8">
          각 데이터 소스의 동기화 상태를 확인하고, 필요한 경우 수동으로 동기화를 시작합니다.
        </p>

        <div className="space-y-6">
          {dataSources.map((source, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {source.status === 'success' && (
                  <CheckCircleIcon className="h-8 w-8 text-green-500" />
                )}
                {source.status === 'failed' && <XCircleIcon className="h-8 w-8 text-red-500" />}
                {source.status === 'syncing' && (
                  <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                )}
                {source.status === 'idle' && <CloudArrowUpIcon className="h-8 w-8 text-gray-400" />}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                  <p className="text-sm text-gray-600">마지막 동기화: {source.lastSync}</p>
                  <p className="text-sm text-gray-600">다음 동기화 예정: {source.nextSync}</p>
                  <p className="text-sm text-gray-700 font-medium">
                    상태:
                    <span
                      className={`ml-1 ${source.status === 'success' ? 'text-green-600' : source.status === 'failed' ? 'text-red-600' : source.status === 'syncing' ? 'text-blue-600' : 'text-gray-600'}`}
                    >
                      {source.message}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleManualSync(source.name)}
                disabled={source.status === 'syncing'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {source.status === 'syncing' ? '동기화 중...' : '수동 동기화'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
