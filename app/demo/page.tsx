'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DemoPage() {
  const [demoUser, setDemoUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const demoSession = localStorage.getItem('demo-session')
    if (demoSession) {
      setDemoUser(JSON.parse(demoSession))
    } else {
      router.push('/auth/signin')
    }
  }, [router])

  if (!demoUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 데모 모드 알림 배너 */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm">
        🚀 데모 모드 | Google OAuth 설정 후 실제 기능을 사용하세요 |
        <button
          onClick={() => {
            localStorage.removeItem('demo-session')
            router.push('/auth/signin')
          }}
          className="ml-2 underline hover:no-underline"
        >
          로그아웃
        </button>
      </div>

      {/* 데모용 Dashboard - 실제 세션 없이 작동 */}
      <DemoDashboard user={demoUser} />
    </div>
  )
}

function DemoDashboard({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState('utm-builder')

  const navigation = [
    { name: '대시보드', id: 'dashboard' },
    { name: 'UTM 빌더', id: 'utm-builder' },
    { name: 'UTM 관리', id: 'utm-list' },
    { name: '설정', id: 'settings' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 대시보드 (데모)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">총 캠페인</h3>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">활성 캠페인</h3>
                  <p className="text-2xl font-bold text-green-600">8</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900">이번 주 클릭</h3>
                  <p className="text-2xl font-bold text-yellow-600">1,234</p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'utm-builder':
        return <DemoUTMBuilder />
      case 'utm-list':
        return <DemoUTMList />
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ 설정 (데모)</h2>
              <p className="text-gray-600 mb-4">
                실제 환경에서는 다음 설정들을 관리할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Google Analytics 4 연동</li>
                <li>Search Console 연동</li>
                <li>Slack 알림 설정</li>
                <li>보고서 자동화 스케줄</li>
              </ul>
            </div>
          </div>
        )
      default:
        return <DemoUTMBuilder />
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === item.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 컨텐츠 */}
      {renderContent()}
    </div>
  )
}

function DemoUTMBuilder() {
  const [formData, setFormData] = useState({
    baseUrl: 'https://rtm.ai',
    source: 'google',
    medium: 'cpc',
    campaign: 'summer_sale_2024',
    term: 'running shoes',
    content: 'ad_variant_a'
  })

  const generateUrl = () => {
    if (!formData.baseUrl || !formData.source || !formData.medium || !formData.campaign) {
      return ''
    }

    const url = new URL(formData.baseUrl)
    const params = new URLSearchParams()

    params.set('utm_source', formData.source)
    params.set('utm_medium', formData.medium)
    params.set('utm_campaign', formData.campaign)

    if (formData.term) params.set('utm_term', formData.term)
    if (formData.content) params.set('utm_content', formData.content)

    return `${url.origin}${url.pathname}?${params.toString()}`
  }

  const generatedUrl = generateUrl()

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 UTM 빌더 (데모)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">기본 URL</label>
          <input
            type="url"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">UTM Source</label>
          <input
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">UTM Medium</label>
          <input
            value={formData.medium}
            onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">UTM Campaign</label>
          <input
            value={formData.campaign}
            onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">UTM Term</label>
          <input
            value={formData.term}
            onChange={(e) => setFormData({ ...formData, term: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="label">UTM Content</label>
          <input
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="input-field"
          />
        </div>
      </div>

      {generatedUrl && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <label className="label">생성된 URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={generatedUrl}
              readOnly
              className="input-field bg-white"
            />
            <button
              onClick={() => navigator.clipboard.writeText(generatedUrl)}
              className="btn-secondary"
            >
              복사
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DemoUTMList() {
  const demoData = [
    {
      id: '1',
      campaign: 'summer_sale_2024',
      source: 'google',
      medium: 'cpc',
      url: 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale_2024',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      campaign: 'brand_awareness',
      source: 'facebook',
      medium: 'social',
      url: 'https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=brand_awareness',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
  ]

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 UTM 캠페인 목록 (데모)</h2>

      <div className="space-y-4">
        {demoData.map((campaign) => (
          <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{campaign.campaign}</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                활성
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div><span className="font-medium">소스:</span> {campaign.source}</div>
              <div><span className="font-medium">매체:</span> {campaign.medium}</div>
            </div>

            <div className="p-2 bg-gray-50 rounded text-sm">
              <code className="break-all">{campaign.url}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}