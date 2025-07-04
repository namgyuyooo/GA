'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AuthenticatedLayout from './AuthenticatedLayout'
import DashboardContent from './DashboardContent'
import UTMBuilder from './UTMBuilder'
import UTMList from './UTMList'
import UTMCohortAnalysis from './UTMCohortAnalysis'
import KeywordCohortAnalysis from './KeywordCohortAnalysis'
import TrafficSourceAnalysis from './TrafficSourceAnalysis'
import GTMAnalysis from './GTMAnalysis'
import WeeklyReport from './WeeklyReport'
import Settings from './Settings'

export default function MainLayout() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeProperty, setActiveProperty] = useState('464147982')
  const [dataMode, setDataMode] = useState<'realtime' | 'database'>('database')
  const [isDataLoading, setIsDataLoading] = useState(false)

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (tabParam && ['dashboard', 'utm-builder', 'utm-list', 'utm-cohort', 'keyword-cohort', 'traffic-analysis', 'gtm-analysis', 'weekly-report'].includes(tabParam)) {
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
      case 'weekly-report':
        return <WeeklyReport propertyId={activeProperty} />
      default:
        return <DashboardContent {...commonProps} />
    }
  }

  return (
    <AuthenticatedLayout activeTab={activeTab}>
      {renderContent()}
    </AuthenticatedLayout>
  )
}