'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { BuildingOfficeIcon, ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface CompetitorData {
  competitorName?: string
  homepageUrl?: string
  koreanName?: string
  englishName?: string
  relatedInfo?: string
  estimatedTraffic: number
  topKeywords: Array<{
    keyword: string
    rank: number
  }>
}

export default function CompetitorIntelligencePage() {
  const [competitorName, setCompetitorName] = useState('')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [koreanName, setKoreanName] = useState('')
  const [englishName, setEnglishName] = useState('')
  const [relatedInfo, setRelatedInfo] = useState('')
  const [competitorData, setCompetitorData] = useState<CompetitorData[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchCompetitorData = async () => {
    if (
      !competitorName.trim() &&
      !homepageUrl.trim() &&
      !koreanName.trim() &&
      !englishName.trim() &&
      !relatedInfo.trim()
    ) {
      toast.error('분석할 경쟁사 정보를 하나 이상 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/tools/competitor-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitorName: competitorName.trim(),
          homepageUrl: homepageUrl.trim(),
          koreanName: koreanName.trim(),
          englishName: englishName.trim(),
          relatedInfo: relatedInfo.trim(),
        }),
      })

      const result = await response.json()
      if (result.success) {
        setCompetitorData(result.data)
        toast.success(`경쟁사 데이터 로드 완료`)
      } else {
        toast.error(result.message || '경쟁사 데이터 로드 실패')
        setCompetitorData(null)
      }
    } catch (error) {
      console.error('Failed to fetch competitor data:', error)
      toast.error('경쟁사 데이터 로드 중 오류 발생')
      setCompetitorData(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <BuildingOfficeIcon className="h-10 w-10 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">경쟁사 분석 대시보드</h1>
        </div>
        <p className="text-gray-600 mb-8">
          주요 경쟁사의 웹사이트 트래픽, 키워드 순위 등을 분석하여 시장 내 위치를 파악하고 전략을
          수립합니다.
        </p>

        {/* 검색 입력 */}
        <div className="space-y-4 mb-8">
          <div>
            <label htmlFor="competitorName" className="block text-sm font-medium text-gray-700">
              경쟁사 이름 (필수 아님)
            </label>
            <input
              type="text"
              id="competitorName"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="경쟁사 이름 (예: 인터엑스)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="homepageUrl" className="block text-sm font-medium text-gray-700">
              홈페이지 URL (필수 아님)
            </label>
            <input
              type="text"
              id="homepageUrl"
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              placeholder="홈페이지 URL (예: https://interxlab.com)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="koreanName" className="block text-sm font-medium text-gray-700">
                한글명 (필수 아님)
              </label>
              <input
                type="text"
                id="koreanName"
                value={koreanName}
                onChange={(e) => setKoreanName(e.target.value)}
                placeholder="한글명 (예: 인터엑스)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label htmlFor="englishName" className="block text-sm font-medium text-gray-700">
                영문명 (필수 아님)
              </label>
              <input
                type="text"
                id="englishName"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="영문명 (예: interx)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="relatedInfo" className="block text-sm font-medium text-gray-700">
              관련 정보 (필수 아님)
            </label>
            <textarea
              id="relatedInfo"
              value={relatedInfo}
              onChange={(e) => setRelatedInfo(e.target.value)}
              placeholder="직접EHM/직접접hubble 등 추가 정보 입력"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            ></textarea>
          </div>
          <button
            onClick={fetchCompetitorData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 w-full justify-center"
          >
            <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
            {isLoading ? '분석 중...' : '분석'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="ml-4 text-gray-600">경쟁사 데이터 로드 중...</p>
          </div>
        ) : competitorData ? (
          <div className="space-y-6">
            {competitorData.map((data, index) => (
              <div
                key={index}
                className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg shadow-md"
              >
                <h3 className="text-2xl font-bold text-purple-800 mb-4">
                  경쟁사:{' '}
                  {data.competitorName || data.koreanName || data.englishName || data.homepageUrl}
                </h3>
                {data.homepageUrl && (
                  <p className="text-sm text-gray-600">
                    홈페이지:{' '}
                    <a
                      href={data.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      {data.homepageUrl}
                    </a>
                  </p>
                )}
                {data.koreanName && (
                  <p className="text-sm text-gray-600">한글명: {data.koreanName}</p>
                )}
                {data.englishName && (
                  <p className="text-sm text-gray-600">영문명: {data.englishName}</p>
                )}
                {data.relatedInfo && (
                  <p className="text-sm text-gray-600">관련 정보: {data.relatedInfo}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-lg font-medium text-gray-700">예상 월간 트래픽:</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {data.estimatedTraffic.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">주요 키워드:</p>
                    <ul className="list-disc list-inside text-gray-600">
                      {data.topKeywords.map((kw, kwIndex) => (
                        <li key={kwIndex}>
                          {kw.keyword} (순위: {kw.rank})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">
              경쟁사 데이터를 불러올 수 없습니다. 검색어를 입력하고 분석 버튼을 눌러주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
