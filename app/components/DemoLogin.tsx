'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDemoLogin = async () => {
    setIsLoading(true)

    // 개발 모드에서는 로컬 스토리지에 가짜 세션 저장
    const demoUser = {
      id: 'demo-user',
      name: '데모 사용자',
      email: 'demo@example.com',
      image: 'https://via.placeholder.com/40',
      role: 'USER',
    }

    localStorage.setItem('demo-session', JSON.stringify(demoUser))

    setTimeout(() => {
      setIsLoading(false)
      router.push('/demo')
    }, 1000)
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-medium text-blue-900 mb-2">🚀 개발 모드로 체험하기</h3>
      <p className="text-xs text-blue-700 mb-3">
        Google OAuth 설정 없이 애플리케이션을 체험해보세요
      </p>
      <button
        onClick={handleDemoLogin}
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="loading-spinner w-4 h-4 mr-2"></div>
            로딩 중...
          </>
        ) : (
          '데모 모드로 시작하기'
        )}
      </button>
    </div>
  )
}
