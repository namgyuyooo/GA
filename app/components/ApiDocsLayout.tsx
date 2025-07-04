'use client'

import { ReactNode } from 'react'
import SideNavigation from './SideNavigation'

interface ApiDocsLayoutProps {
  children: ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  onLogout?: () => void
}

export default function ApiDocsLayout({ children, user, onLogout }: ApiDocsLayoutProps) {
  const handleTabChange = (tab: string) => {
    // API 문서 페이지에서는 탭 변경을 페이지 이동으로 처리
    if (tab === 'dashboard') {
      window.location.href = '/'
    } else {
      window.location.href = `/?tab=${tab}`
    }
  }

  const handlePropertyChange = (propertyId: string) => {
    // 속성 변경은 URL에 반영
    const url = new URL(window.location.href)
    url.searchParams.set('propertyId', propertyId)
    window.location.href = url.toString()
  }

  const handleBulkDataLoad = () => {
    // API 문서 페이지에서는 비활성화
    alert('API 문서 페이지에서는 사용할 수 없습니다.')
  }

  const handleDataModeChange = (mode: 'realtime' | 'database') => {
    // API 문서 페이지에서는 비활성화
    console.log('Data mode change not available in API docs')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <SideNavigation
        activeTab="api-docs"
        onTabChange={handleTabChange}
        activeProperty="464147982"
        onPropertyChange={handlePropertyChange}
        user={user}
        onLogout={onLogout}
        onBulkDataLoad={handleBulkDataLoad}
        isDataLoading={false}
        dataMode="realtime"
        onDataModeChange={handleDataModeChange}
      />
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}