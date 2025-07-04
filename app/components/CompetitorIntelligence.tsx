'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  XMarkIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface Competitor {
  id: string
  name: string
  domain: string
  description?: string
  industry?: string
  keywords: string[]
  isActive: boolean
  createdAt: string
}

interface CompetitorAnalysis {
  domain: string
  keyword: string
  totalResults: number
  pages: Array<{
    title: string
    url: string
    description: string
    rank: number
  }>
  summary: {
    hasContent: boolean
    topRanking: number | null
    contentCount: number
  }
}

export default function CompetitorIntelligence() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<CompetitorAnalysis[]>([])
  
  // Form states
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    domain: '',
    description: '',
    industry: '',
    keywords: [] as string[],
  })
  const [keywordInput, setKeywordInput] = useState('')

  useEffect(() => {
    loadCompetitors()
  }, [])

  const loadCompetitors = async () => {
    try {
      const response = await fetch('/api/tools/competitor-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      const result = await response.json()
      if (result.success) {
        setCompetitors(result.competitors)
      }
    } catch (error) {
      console.error('경쟁사 목록 로드 실패:', error)
    }
  }

  const addCompetitor = async () => {
    if (!newCompetitor.name || !newCompetitor.domain) {
      toast.error('경쟁사 이름과 도메인을 입력해주세요')
      return
    }

    try {
      const response = await fetch('/api/tools/competitor-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create',
          competitor: newCompetitor
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('경쟁사가 등록되었습니다')
        setNewCompetitor({
          name: '',
          domain: '',
          description: '',
          industry: '',
          keywords: [],
        })
        setShowAddForm(false)
        loadCompetitors()
      } else {
        toast.error(result.message || '경쟁사 등록 실패')
      }
    } catch (error) {
      toast.error('경쟁사 등록 중 오류 발생')
    }
  }

  const deleteCompetitor = async (id: string) => {
    try {
      const response = await fetch('/api/tools/competitor-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete',
          id
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('경쟁사가 삭제되었습니다')
        loadCompetitors()
      }
    } catch (error) {
      toast.error('경쟁사 삭제 중 오류 발생')
    }
  }

  const analyzeCompetitor = async (competitor: Competitor) => {
    if (competitor.keywords.length === 0) {
      toast.error('분석할 키워드가 없습니다')
      return
    }

    setIsLoading(true)
    try {
      const results: CompetitorAnalysis[] = []
      
      for (const keyword of competitor.keywords) {
        const response = await fetch(
          `/api/tools/competitor-intelligence?domain=${encodeURIComponent(competitor.domain)}&keyword=${encodeURIComponent(keyword)}`
        )
        const result = await response.json()
        if (result.success) {
          results.push(result.data)
        }
      }
      
      setAnalysisResults(results)
      toast.success(`${competitor.name} 분석 완료`)
    } catch (error) {
      toast.error('경쟁사 분석 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !newCompetitor.keywords.includes(keywordInput.trim())) {
      setNewCompetitor({
        ...newCompetitor,
        keywords: [...newCompetitor.keywords, keywordInput.trim()]
      })
      setKeywordInput('')
    }
  }

  const removeKeyword = (index: number) => {
    setNewCompetitor({
      ...newCompetitor,
      keywords: newCompetitor.keywords.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 mr-3 text-purple-600" />
            경쟁사 분석
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Brave Search API를 통한 경쟁사 키워드 순위 및 콘텐츠 분석
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          경쟁사 추가
        </button>
      </div>

      {/* Add Competitor Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">새 경쟁사 등록</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">경쟁사 이름</label>
              <input
                type="text"
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="예: 네이버"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">도메인</label>
              <input
                type="text"
                value={newCompetitor.domain}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, domain: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="예: naver.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">업종</label>
              <input
                type="text"
                value={newCompetitor.industry}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="예: 검색엔진"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">설명</label>
              <input
                type="text"
                value={newCompetitor.description}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="간단한 설명"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">모니터링 키워드</label>
            <div className="flex mt-1">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="키워드 입력 후 Enter"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newCompetitor.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={addCompetitor}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map((competitor) => (
          <div key={competitor.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{competitor.name}</h3>
              <button
                onClick={() => deleteCompetitor(competitor.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <GlobeAltIcon className="h-4 w-4 mr-2" />
                {competitor.domain}
              </div>
              {competitor.industry && (
                <div>업종: {competitor.industry}</div>
              )}
              {competitor.description && (
                <div>설명: {competitor.description}</div>
              )}
              <div>키워드: {competitor.keywords.length}개</div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {competitor.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {keyword}
                </span>
              ))}
              {competitor.keywords.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                  +{competitor.keywords.length - 3}
                </span>
              )}
            </div>
            
            <button
              onClick={() => analyzeCompetitor(competitor)}
              disabled={isLoading || competitor.keywords.length === 0}
              className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {isLoading ? '분석 중...' : '키워드 분석'}
            </button>
          </div>
        ))}
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            분석 결과
          </h3>
          
          <div className="space-y-6">
            {analysisResults.map((result, index) => (
              <div key={index} className="border-l-4 border-purple-400 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {result.domain} - "{result.keyword}"
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    result.summary.hasContent 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.summary.hasContent ? '콘텐츠 발견' : '콘텐츠 없음'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  총 {result.totalResults}개 결과 | 
                  {result.summary.topRanking ? ` 최고 순위: ${result.summary.topRanking}위` : ' 순위권 없음'}
                </div>
                
                {result.pages.length > 0 && (
                  <div className="space-y-2">
                    {result.pages.slice(0, 3).map((page, pageIndex) => (
                      <div key={pageIndex} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-gray-900">{page.title}</h5>
                            <p className="text-xs text-gray-600 mt-1">{page.description}</p>
                            <a 
                              href={page.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-600 hover:underline"
                            >
                              {page.url}
                            </a>
                          </div>
                          <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            #{page.rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {competitors.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">등록된 경쟁사가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">
            새 경쟁사를 추가하여 키워드 분석을 시작하세요
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              경쟁사 추가
            </button>
          </div>
        </div>
      )}
    </div>
  )
}