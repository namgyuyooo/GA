'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { 
  HomeIcon, 
  LinkIcon, 
  ChartBarIcon, 
  CogIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import UTMBuilder from './UTMBuilder'
import UTMList from './UTMList'

const navigation = [
  { name: '대시보드', href: '#', icon: HomeIcon, id: 'dashboard' },
  { name: 'UTM 빌더', href: '#', icon: LinkIcon, id: 'utm-builder' },
  { name: 'UTM 관리', href: '#', icon: ChartBarIcon, id: 'utm-list' },
  { name: '설정', href: '#', icon: CogIcon, id: 'settings' },
]

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('utm-builder')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">대시보드</h2>
              <p className="text-gray-600">
                UTM 캠페인 성과 및 주요 지표를 확인하세요.
              </p>
            </div>
          </div>
        )
      case 'utm-builder':
        return <UTMBuilder />
      case 'utm-list':
        return <UTMList />
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">설정</h2>
              <p className="text-gray-600">
                애플리케이션 설정을 관리하세요.
              </p>
            </div>
          </div>
        )
      default:
        return <UTMBuilder />
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
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
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">U</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">UTM Dashboard</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left ${
                    activeTab === item.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-4 h-6 w-6" />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <div className="inline-block h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {session?.user?.image ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={session.user.image}
                      alt=""
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  )}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{session?.user?.name}</p>
                <button
                  onClick={() => signOut()}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">U</span>
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900">UTM Dashboard</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                      activeTab === item.id
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div>
                  <div className="inline-block h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center">
                    {session?.user?.image ? (
                      <img
                        className="h-9 w-9 rounded-full"
                        src={session.user.image}
                        alt=""
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{session?.user?.name}</p>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        
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