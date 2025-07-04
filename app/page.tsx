'use client'

import { useAuth } from './contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MainLayout from './components/MainLayout'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // 로딩 중이면 대기

    if (!user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

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

  return <MainLayout />
}
