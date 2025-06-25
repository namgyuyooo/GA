'use client'

import { useState } from 'react'
import SideNavigation from './SideNavigation'
import DashboardContent from './DashboardContent'
import UTMBuilder from './UTMBuilder'
import UTMList from './UTMList'
import UTMCohortAnalysis from './UTMCohortAnalysis'
import KeywordCohortAnalysis from './KeywordCohortAnalysis'
import TrafficSourceAnalysis from './TrafficSourceAnalysis'
import GTMAnalysis from './GTMAnalysis'

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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent propertyId={activeProperty} />
      case 'utm-builder':
        return <UTMBuilder />
      case 'utm-list':
        return <UTMList />
      case 'utm-cohort':
        return <UTMCohortAnalysis propertyId={activeProperty} />
      case 'keyword-cohort':
        return <KeywordCohortAnalysis propertyId={activeProperty} />
      case 'traffic-analysis':
        return <TrafficSourceAnalysis propertyId={activeProperty} />
      case 'gtm-analysis':
        return <GTMAnalysis />
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">현재 설정</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">활성 속성:</span>
                        <span className="ml-2 text-gray-600">{activeProperty}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">사용자:</span>
                        <span className="ml-2 text-gray-600">{user?.name || 'Guest'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 소스</h3>
                  <p className="text-gray-600">
                    Google Analytics 4 속성에서 데이터를 가져옵니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
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
        return <IntegratedDashboard propertyId={activeProperty} />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeProperty={activeProperty}
        onPropertyChange={setActiveProperty}
        user={user}
        onLogout={onLogout}
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