'use client'

import { useState, useEffect } from 'react'
import SideNavigation from './SideNavigation'
import DashboardContent from './DashboardContent'
import UTMBuilder from './UTMBuilder'
import UTMList from './UTMList'
import UTMCohortAnalysis from './UTMCohortAnalysis'
import KeywordCohortAnalysis from './KeywordCohortAnalysis'
import TrafficSourceAnalysis from './TrafficSourceAnalysis'
import GTMAnalysis from './GTMAnalysis'
import WeeklyReport from './WeeklyReport'
import Settings from './Settings'

interface MainLayoutProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onLogout?: () => void
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeProperty, setActiveProperty] = useState('464147982')
  const [dataMode, setDataMode] = useState<'realtime' | 'database'>('database')
  const [isDataLoading, setIsDataLoading] = useState(false)

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (tabParam && ['dashboard', 'utm-builder', 'utm-list', 'utm-cohort', 'keyword-cohort', 'traffic-analysis', 'gtm-analysis', 'user-journey', 'weekly-report', 'settings', 'property-check'].includes(tabParam)) {
        setActiveTab(tabParam)
      }
    }
  }, [])

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const handleBulkDataLoad = async () => {
    setIsDataLoading(true)
    try {
      const response = await fetch('/api/analytics/bulk-load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeProperty,
          dateRange: {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`일괄 데이터 로드 완료!\n트래픽: ${result.data.trafficRows}행\n페이지: ${result.data.pageRows}행\n검색어: ${result.data.searchRows}행`)
      } else {
        alert(`오류: ${result.error}`)
      }
    } catch (error) {
      console.error('Bulk data load error:', error)
      alert('일괄 데이터 로드 중 오류가 발생했습니다.')
    } finally {
      setIsDataLoading(false)
    }
  }

  const handleDataModeChange = (mode: 'realtime' | 'database') => {
    setDataMode(mode)
    // 데이터 모드 변경 시 필요한 추가 로직
    console.log(`Data mode changed to: ${mode}`)
  }

  const renderContent = () => {
    const commonProps = {
      propertyId: activeProperty,
      dataMode: dataMode
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent {...commonProps} />
      case 'utm-builder':
        return <UTMBuilder />
      case 'utm-list':
        return <UTMList />
      case 'utm-cohort':
        return <UTMCohortAnalysis {...commonProps} />
      case 'keyword-cohort':
        return <KeywordCohortAnalysis {...commonProps} />
      case 'traffic-analysis':
        return <TrafficSourceAnalysis {...commonProps} />
      case 'gtm-analysis':
        return <GTMAnalysis {...commonProps} />
      case 'user-journey':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">사용자 여정 분석</h2>
              <p className="text-gray-600 mb-4">
                사용자의 페이지 전환 경로, 체류 시간, 스크롤 깊이, 재방문율 등을 분석합니다.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  사용자 여정 분석은 별도 페이지에서 제공됩니다. 
                  <a href={`/analytics/user-journey?propertyId=${activeProperty}`} className="text-blue-600 hover:text-blue-800 underline ml-1">
                    상세 분석 보기 →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )
      case 'weekly-report':
        return <WeeklyReport propertyId={activeProperty} />
      case 'settings':
        return <Settings />
      case 'property-check':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">속성 연결 확인</h2>
              <p className="text-gray-600 mb-4">
                현재 연결된 Google Analytics 속성들을 확인하고 테스트합니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Property 1</h3>
                  <p className="text-sm text-gray-600">ID: 464147982</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    연결됨
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Property 2</h3>
                  <p className="text-sm text-gray-600">ID: 482625214</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    연결됨
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Property 3</h3>
                  <p className="text-sm text-gray-600">ID: 483589217</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    연결됨
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Original Property</h3>
                  <p className="text-sm text-gray-600">ID: 462871516</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    테스트 필요
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <DashboardContent {...commonProps} />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeProperty={activeProperty}
        onPropertyChange={setActiveProperty}
        user={user}
        onLogout={onLogout}
        onBulkDataLoad={handleBulkDataLoad}
        isDataLoading={isDataLoading}
        dataMode={dataMode}
        onDataModeChange={handleDataModeChange}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}