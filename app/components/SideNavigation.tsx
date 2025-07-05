'use client'

import {
  Bars3Icon,
  BookOpenIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CogIcon,
  FunnelIcon,
  GlobeAltIcon,
  HomeIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PresentationChartLineIcon,
  TagIcon,
  UserIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ServerIcon,
  BoltIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CodeBracketIcon,
  UsersIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RocketLaunchIcon, // Added for Marketing Simulator
  CloudArrowUpIcon, // Added for Data Sync
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import Image from 'next/image'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  id: string
}

interface NavigationGroup {
  name: string
  icon: React.ComponentType<any>
  children: NavigationItem[]
}

type NavigationEntry = NavigationItem | NavigationGroup

interface Property {
  id: string
  name: string
}

interface SideNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  activeProperty: string
  onPropertyChange: (propertyId: string) => void
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
  onLogout?: () => void
  onBulkDataLoad?: () => void
  isDataLoading?: boolean
  dataMode: 'realtime' | 'database'
  onDataModeChange?: (mode: 'realtime' | 'database') => void
}

const navigation: NavigationEntry[] = [
  { name: '대시보드', href: '/', icon: HomeIcon, id: 'dashboard' },
  {
    name: '통합 분석',
    icon: ChartBarIcon,
    children: [
      { name: 'GA 핵심 분석', href: '#', icon: ChartBarIcon, id: 'dashboard' },
      { name: '세션', href: '/analytics/sessions', icon: ChartBarIcon, id: 'sessions' },
      { name: '사용자', href: '/analytics/users', icon: UsersIcon, id: 'users' },
      { name: '페이지뷰', href: '/analytics/pageviews', icon: EyeIcon, id: 'pageviews' },
      { name: '전환', href: '/analytics/conversions', icon: CurrencyDollarIcon, id: 'conversions' },
      { name: '키워드 코호트 분석', href: '#', icon: MagnifyingGlassIcon, id: 'keyword-cohort' },
      { name: '트래픽 소스 분석', href: '#', icon: GlobeAltIcon, id: 'traffic-analysis' },
      { name: 'GTM 분석', href: '#', icon: TagIcon, id: 'gtm-analysis' },
      {
        name: '사용자 여정 분석',
        href: '/analytics/user-journey',
        icon: UserIcon,
        id: 'user-journey',
      },
      {
        name: '전환 퍼널 분석',
        href: '/analytics/conversion-funnel',
        icon: FunnelIcon,
        id: 'conversion-funnel',
      },
      {
        name: '블로그 성과 분석',
        href: '/analytics/blog-performance',
        icon: BookOpenIcon,
        id: 'blog-performance',
      },
    ],
  },
  {
    name: '리포트',
    icon: DocumentTextIcon,
    children: [
      { name: '주간보고서', href: '#', icon: CalendarDaysIcon, id: 'weekly-report' },
      { name: '보고서 관리', href: '/reports', icon: DocumentTextIcon, id: 'reports' },
    ],
  },
  {
    name: '도구',
    icon: CodeBracketIcon,
    children: [
      { name: 'UTM 빌더', href: '#', icon: LinkIcon, id: 'utm-builder' },
      { name: 'UTM 관리', href: '#', icon: ChartBarIcon, id: 'utm-list' },
      { name: 'UTM 코호트 분석', href: '#', icon: PresentationChartLineIcon, id: 'utm-cohort' },
      {
        name: '경쟁사 분석',
        href: '/tools/competitor-intelligence',
        icon: BuildingOfficeIcon,
        id: 'competitor-intelligence',
      },
    ],
  },
  {
    name: '설정',
    icon: CogIcon,
    children: [
      { name: '설정', href: '/settings', icon: CogIcon, id: 'settings' },
      { name: 'API 문서', href: '/api-docs', icon: CodeBracketIcon, id: 'api-docs' },
      { name: '속성 연결 확인', href: '#', icon: BuildingOfficeIcon, id: 'property-check' },
    ],
  },
]

const properties: Property[] = [
  { id: '464147982', name: 'Homepage' },
  { id: '482625214', name: 'POC' },
  { id: '483589217', name: 'POC-Landing' },
]

export default function SideNavigation({
  activeTab,
  onTabChange,
  activeProperty,
  onPropertyChange,
  user,
  onLogout,
  onBulkDataLoad,
  isDataLoading = false,
  dataMode = 'realtime',
  onDataModeChange,
}: SideNavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set()) // State to manage open/closed groups

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    setSidebarOpen(false)
  }

  const handleBulkDataLoad = () => {
    if (onBulkDataLoad) {
      onBulkDataLoad()
    }
  }

  const handleDataModeChange = (mode: 'realtime' | 'database') => {
    if (onDataModeChange) {
      onDataModeChange(mode)
    }
  }

  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
        <div className="flex-shrink-0 flex items-center px-4">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">GA</span>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">Analytics Dashboard</span>
        </div>

        {/* Property Selector */}
        <div className="mt-6 px-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            GA 속성
          </label>
          <select
            value={activeProperty}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} ({property.id})
              </option>
            ))}
          </select>
        </div>

        {/* Data Mode Toggle */}
        <div className="mt-4 px-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            데이터 모드
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDataModeChange('realtime')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                dataMode === 'realtime' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <BoltIcon className="mr-2 h-4 w-4" />
              실시간
            </button>
            <button
              onClick={() => handleDataModeChange('database')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                dataMode === 'database'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <ServerIcon className="mr-2 h-4 w-4" />
              DB
            </button>
          </div>
        </div>

        <nav className="mt-8 px-2 space-y-1">
          {navigation.map((entry) => {
            if ('children' in entry) {
              // It's a group
              const isOpen = openGroups.has(entry.name)
              return (
                <div key={entry.name}>
                  <button
                    onClick={() => toggleGroup(entry.name)}
                    className={`group flex items-center px-2 py-2 ${
                      isMobile ? 'text-base' : 'text-sm'
                    } font-medium rounded-md w-full text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                  >
                    <entry.icon className={`${isMobile ? 'mr-4 h-6 w-6' : 'mr-3 h-6 w-6'}`} />
                    {entry.name}
                    {isOpen ? (
                      <ChevronUpIcon className="ml-auto h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="ml-auto h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-4 space-y-1">
                      {entry.children.map((item) => {
                        if (item.href !== '#') {
                          return (
                            <a
                              key={item.name}
                              href={item.href}
                              className={`group flex items-center px-2 py-2 ${
                                isMobile ? 'text-base' : 'text-sm'
                              } font-medium rounded-md w-full text-left ${
                                activeTab === item.id
                                  ? 'bg-primary-100 text-primary-900'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <item.icon
                                className={`${isMobile ? 'mr-4 h-6 w-6' : 'mr-3 h-6 w-6'}`}
                              />
                              {item.name}
                            </a>
                          )
                        }
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleTabChange(item.id)}
                            className={`group flex items-center px-2 py-2 ${
                              isMobile ? 'text-base' : 'text-sm'
                            } font-medium rounded-md w-full text-left ${
                              activeTab === item.id
                                ? 'bg-primary-100 text-primary-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <item.icon
                              className={`${isMobile ? 'mr-4 h-6 w-6' : 'mr-3 h-6 w-6'}`}
                            />
                            {item.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            } else {
              // It's a single item
              if (entry.href !== '#') {
                return (
                  <a
                    key={entry.name}
                    href={entry.href}
                    className={`group flex items-center px-2 py-2 ${
                      isMobile ? 'text-base' : 'text-sm'
                    } font-medium rounded-md w-full text-left ${
                      activeTab === entry.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <entry.icon className={`${isMobile ? 'mr-4 h-6 w-6' : 'mr-3 h-6 w-6'}`} />
                    {entry.name}
                  </a>
                )
              }
              return (
                <button
                  key={entry.name}
                  onClick={() => handleTabChange(entry.id)}
                  className={`group flex items-center px-2 py-2 ${
                    isMobile ? 'text-base' : 'text-sm'
                  } font-medium rounded-md w-full text-left ${
                    activeTab === entry.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <entry.icon className={`${isMobile ? 'mr-4 h-6 w-6' : 'mr-3 h-6 w-6'}`} />
                  {entry.name}
                </button>
              )
            }
          })}
        </nav>

        {/* Quick Actions - Removed as per new navigation structure */}
        {/* <div className="mt-8 px-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            빠른 작업
          </label>
          <div className="space-y-1">
            <button
              onClick={() => handleTabChange('property-check')}
              className="flex items-center w-full px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              <BuildingOfficeIcon className="mr-3 h-5 w-5" />
              속성 연결 확인
            </button>
            <button
              onClick={handleBulkDataLoad}
              disabled={isDataLoading}
              className={`flex items-center w-full px-2 py-2 text-sm rounded-md transition-colors ${
                isDataLoading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ArrowDownTrayIcon className={`mr-3 h-5 w-5 ${isDataLoading ? 'animate-spin' : ''}`} />
              {isDataLoading ? '데이터 로드 중...' : '일괄 데이터 로드'}
            </button>
          </div>
        </div> */}
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div>
            <div className="inline-block h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center">
              {user?.image ? (
                <Image
                  className="h-9 w-9 rounded-full"
                  src={user.image}
                  alt="User avatar"
                  width={36}
                  height={36}
                />
              ) : (
                <UserIcon className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.name || 'Guest User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 mt-1"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <SidebarContent isMobile={true} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <SidebarContent />
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
        <button
          type="button"
          className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>
    </>
  )
}
