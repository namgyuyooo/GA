'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import SideNavigation from './SideNavigation'

interface AuthenticatedLayoutProps {
  children: ReactNode
  activeTab?: string
  showSidebar?: boolean
}

export default function AuthenticatedLayout({
  children,
  activeTab = 'dashboard',
  showSidebar = true,
}: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // 로딩 중이면 대기

    if (!user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  const handleTabChange = (tab: string) => {
    // 탭에 따른 페이지 이동
    switch (tab) {
      case 'dashboard':
        router.push('/')
        break
      case 'utm-builder':
      case 'utm-list':
      case 'utm-cohort':
      case 'keyword-cohort':
      case 'traffic-analysis':
      case 'gtm-analysis':
      case 'user-journey':
      case 'weekly-report':
      case 'property-check':
        router.push(`/?tab=${tab}`)
        break
      case 'reports':
        router.push('/reports')
        break
      case 'api-docs':
        router.push('/api-docs')
        break
      case 'settings':
        router.push('/settings')
        break
      default:
        router.push('/')
    }
  }

  const handlePropertyChange = (propertyId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('propertyId', propertyId)
    router.push(url.toString())
  }

  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleBulkDataLoad = async () => {
    try {
      const response = await fetch('/api/analytics/bulk-load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: '464147982',
          dateRange: {
            startDate: '30daysAgo',
            endDate: 'today',
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `일괄 데이터 로드 완료!\n트래픽: ${result.data.trafficRows}행\n페이지: ${result.data.pageRows}행\n검색어: ${result.data.searchRows}행`
        )
      } else {
        alert(`오류: ${result.error}`)
      }
    } catch (error) {
      console.error('Bulk data load error:', error)
      alert('일괄 데이터 로드 중 오류가 발생했습니다.')
    }
  }

  const handleDataModeChange = (mode: 'realtime' | 'database') => {
    // 데이터 모드 변경 로직
    console.log(`Data mode changed to: ${mode}`)
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">로딩 중...</span>
      </div>
    )
  }

  // 인증되지 않은 사용자
  if (!user) {
    return null
  }

  // 사이드바가 없는 레이아웃 (전체 화면)
  if (!showSidebar) {
    return <div className="min-h-screen bg-gray-100">{children}</div>
  }

  // 기본 레이아웃 (사이드바 포함)
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <SideNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeProperty="464147982"
        onPropertyChange={handlePropertyChange}
        user={user}
        onLogout={handleLogout}
        onBulkDataLoad={handleBulkDataLoad}
        isDataLoading={false}
        dataMode="realtime"
        onDataModeChange={handleDataModeChange}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
