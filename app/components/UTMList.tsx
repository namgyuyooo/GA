'use client'

import {
  ClipboardIcon,
  EyeIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface UTMCampaign {
  id: string
  name: string
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
  url: string
  description?: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
}

export default function UTMList() {
  const [campaigns, setCampaigns] = useState<UTMCampaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/utm/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      toast.error('캠페인 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('URL이 클립보드에 복사되었습니다!')
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }

  const updateCampaignStatus = async (id: string, status: 'ACTIVE' | 'PAUSED') => {
    try {
      const response = await fetch(`/api/utm/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        setCampaigns(campaigns.map(c =>
          c.id === id ? { ...c, status } : c
        ))
        toast.success(`캠페인이 ${status === 'ACTIVE' ? '활성화' : '일시정지'} 되었습니다.`)
      }
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.')
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('정말로 이 캠페인을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/utm/campaigns/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id))
        toast.success('캠페인이 삭제되었습니다.')
      }
    } catch (error) {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'ALL' || campaign.status === filter
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.medium.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', text: '활성' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-800', text: '일시정지' },
      ARCHIVED: { color: 'bg-gray-100 text-gray-800', text: '보관됨' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center h-48">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">UTM 캠페인 목록</h2>
        </div>
        <div className="text-sm text-gray-500">
          총 {campaigns.length}개 캠페인
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {status === 'ALL' ? '전체' :
                status === 'ACTIVE' ? '활성' :
                  status === 'PAUSED' ? '일시정지' : '보관됨'}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="캠페인 제목, 소스, 매체 등으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      {/* 캠페인 목록 */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">생성된 UTM 캠페인이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium text-gray-500">캠페인:</span> {campaign.campaign}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">소스:</span> {campaign.source}
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">매체:</span> {campaign.medium}
                    </div>
                    {campaign.term && (
                      <div>
                        <span className="font-medium text-gray-500">키워드:</span> {campaign.term}
                      </div>
                    )}
                    {campaign.content && (
                      <div>
                        <span className="font-medium text-gray-500">콘텐츠:</span> {campaign.content}
                      </div>
                    )}
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>생성일: {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}</span>
                    {campaign.updatedAt !== campaign.createdAt && (
                      <span>• 수정일: {new Date(campaign.updatedAt).toLocaleDateString('ko-KR')}</span>
                    )}
                  </div>

                  {/* URL 표시 */}
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 break-all">{campaign.url}</code>
                      <button
                        onClick={() => copyToClipboard(campaign.url)}
                        className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700"
                        title="URL 복사"
                      >
                        <ClipboardIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex items-center gap-1 ml-4">
                  {campaign.status === 'ACTIVE' ? (
                    <button
                      onClick={() => updateCampaignStatus(campaign.id, 'PAUSED')}
                      className="p-2 text-gray-500 hover:text-yellow-600"
                      title="일시정지"
                    >
                      <PauseIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateCampaignStatus(campaign.id, 'ACTIVE')}
                      className="p-2 text-gray-500 hover:text-green-600"
                      title="활성화"
                    >
                      <PlayIcon className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => window.open(campaign.url, '_blank')}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="링크 열기"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="삭제"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}