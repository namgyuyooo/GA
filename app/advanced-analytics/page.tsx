'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  ChartBarIcon, 
  FunnelIcon, 
  ArrowTrendingUpIcon, 
  MagnifyingGlassIcon,
  UserGroupIcon,
  EyeSlashIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function AdvancedAnalyticsPage() {
  const [activeAnalysis, setActiveAnalysis] = useState('cohort')
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '30daysAgo',
    endDate: 'today',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    keyword: 'AI 마케팅 도구',
    includeInternal: false,
    tagManagerType: 'overview'
  })

  const analysisTypes = [
    {
      id: 'cohort',
      name: 'UTM 코호트 분석',
      icon: UserGroupIcon,
      description: 'UTM 캠페인별 사용자 리텐션 및 여정 분석',
      color: 'blue'
    },
    {
      id: 'internal-traffic',
      name: '내부 트래픽 분석',
      icon: EyeSlashIcon,
      description: '내부 트래픽 필터링 및 데이터 품질 향상',
      color: 'purple'
    },
    {
      id: 'keyword-ranking',
      name: '검색어 순위 추적',
      icon: ArrowTrendingUpIcon,
      description: '주간/누적 검색어 순위 변동 분석',
      color: 'green'
    },
    {
      id: 'content-drilldown',
      name: '컨텐츠 드릴다운',
      icon: DocumentTextIcon,
      description: '검색어별 컨텐츠 성과 및 최적화 기회',
      color: 'orange'
    },
    {
      id: 'tag-manager',
      name: 'Tag Manager 분석',
      icon: ChartBarIcon,
      description: 'GTM 태그, 트리거, 변수 성과 및 최적화',
      color: 'indigo'
    }
  ]

  useEffect(() => {
    loadAnalysisData()
  }, [activeAnalysis, filters])

  const loadAnalysisData = async () => {
    setIsLoading(true)
    
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          // Tag Manager 분석일 때 'type' 파라미터 매핑
          if (key === 'tagManagerType' && activeAnalysis === 'tag-manager') {
            params.append('type', value.toString())
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const endpoint = getAnalysisEndpoint(activeAnalysis)
      const response = await fetch(`${endpoint}?${params.toString()}`)
      const result = await response.json()
      
      setData(result)
      
      if (response.ok) {
        toast.success('분석 데이터 로드 완료')
      } else {
        toast.error('데이터 로드 실패')
      }
    } catch (err: any) {
      toast.error('네트워크 오류')
      console.error('Analysis load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getAnalysisEndpoint = (type: string) => {
    switch (type) {
      case 'cohort': return '/api/analytics/cohort'
      case 'internal-traffic': return '/api/analytics/internal-traffic'
      case 'keyword-ranking': return '/api/analytics/keyword-ranking'
      case 'content-drilldown': return '/api/analytics/content-drilldown'
      case 'tag-manager': return '/api/analytics/tag-manager'
      default: return '/api/analytics/cohort'
    }
  }

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const renderAnalysisContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mb-4"></div>
            <p className="text-gray-600">분석 데이터 로딩 중...</p>
          </div>
        </div>
      )
    }

    switch (activeAnalysis) {
      case 'cohort':
        return <CohortAnalysisView data={data} />
      case 'internal-traffic':
        return <InternalTrafficView data={data} />
      case 'keyword-ranking':
        return <KeywordRankingView data={data} />
      case 'content-drilldown':
        return <ContentDrilldownView data={data} />
      case 'tag-manager':
        return <TagManagerAnalysisView data={data} />
      default:
        return <div>분석 타입을 선택하세요</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔬 고급 분석 대시보드</h1>
              <p className="mt-2 text-gray-600">UTM 성과의 깊이 있는 인사이트를 발견하세요</p>
            </div>
            <button
              onClick={loadAnalysisData}
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사이드바 - 분석 타입 선택 */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">분석 유형</h3>
              <div className="space-y-2">
                {analysisTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveAnalysis(type.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        activeAnalysis === type.id
                          ? `bg-${type.color}-100 border-${type.color}-500 border-2`
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${activeAnalysis === type.id ? `text-${type.color}-600` : 'text-gray-500'}`} />
                        <div>
                          <h4 className={`font-medium ${activeAnalysis === type.id ? `text-${type.color}-900` : 'text-gray-900'}`}>
                            {type.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 필터 */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">필터</h3>
              <div className="space-y-4">
                {/* UTM 필터 */}
                {(activeAnalysis === 'cohort') && (
                  <>
                    <div>
                      <label className="label">UTM Source</label>
                      <input
                        type="text"
                        value={filters.utmSource}
                        onChange={(e) => updateFilter('utmSource', e.target.value)}
                        className="input-field"
                        placeholder="google, facebook..."
                      />
                    </div>
                    <div>
                      <label className="label">UTM Medium</label>
                      <input
                        type="text"
                        value={filters.utmMedium}
                        onChange={(e) => updateFilter('utmMedium', e.target.value)}
                        className="input-field"
                        placeholder="cpc, social..."
                      />
                    </div>
                    <div>
                      <label className="label">UTM Campaign</label>
                      <input
                        type="text"
                        value={filters.utmCampaign}
                        onChange={(e) => updateFilter('utmCampaign', e.target.value)}
                        className="input-field"
                        placeholder="summer_sale..."
                      />
                    </div>
                  </>
                )}

                {/* 키워드 필터 */}
                {activeAnalysis === 'content-drilldown' && (
                  <div>
                    <label className="label">분석할 키워드</label>
                    <input
                      type="text"
                      value={filters.keyword}
                      onChange={(e) => updateFilter('keyword', e.target.value)}
                      className="input-field"
                      placeholder="AI 마케팅 도구"
                    />
                  </div>
                )}

                {/* 내부 트래픽 필터 */}
                {activeAnalysis === 'internal-traffic' && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.includeInternal}
                        onChange={(e) => updateFilter('includeInternal', e.target.checked)}
                        className="mr-2"
                      />
                      내부 트래픽 포함
                    </label>
                  </div>
                )}

                {/* Tag Manager 필터 */}
                {activeAnalysis === 'tag-manager' && (
                  <div>
                    <label className="label">분석 타입</label>
                    <select
                      value={filters.tagManagerType || 'overview'}
                      onChange={(e) => updateFilter('tagManagerType', e.target.value)}
                      className="input-field"
                    >
                      <option value="overview">전체 개요</option>
                      <option value="triggers">트리거 분석</option>
                      <option value="tags">태그 분석</option>
                      <option value="variables">변수 분석</option>
                      <option value="performance">성능 분석</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-3">
            {renderAnalysisContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

// 코호트 분석 뷰
function CohortAnalysisView({ data }: { data: any }) {
  if (!data) return <div className="card">데이터를 로딩 중입니다...</div>

  return (
    <div className="space-y-6">
      {/* 코호트 히트맵 */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 코호트 리텐션 히트맵</h3>
        {data.data?.analysis?.retentionRates && (
          <div className="grid grid-cols-5 gap-2">
            {data.data.analysis.retentionRates.map((item: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded text-center ${
                  item.retention > 0.7 ? 'bg-green-100 text-green-800' :
                  item.retention > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}
              >
                <div className="text-sm font-medium">Week {item.week}</div>
                <div className="text-lg font-bold">{(item.retention * 100).toFixed(1)}%</div>
                <div className="text-xs">{item.userCount} users</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사용자 여정 */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">🔄 사용자 여정 분석</h3>
        <p className="text-gray-600">UTM 캠페인을 통한 사용자의 행동 패턴을 분석합니다.</p>
      </div>
    </div>
  )
}

// 내부 트래픽 분석 뷰
function InternalTrafficView({ data }: { data: any }) {
  if (!data) return <div className="card">데이터를 로딩 중입니다...</div>

  return (
    <div className="space-y-6">
      {/* 데이터 품질 점수 */}
      {data.data?.overview && (
        <div className="card bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">📈 데이터 품질 점수</h3>
              <p className="text-gray-600">내부 트래픽 필터링 효과</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">{data.data.overview.dataQualityScore}</div>
              <div className="text-sm text-purple-600">/ 100점</div>
            </div>
          </div>
        </div>
      )}

      {/* 캠페인별 영향도 */}
      {data.data?.campaignAnalysis && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 캠페인별 내부 트래픽 영향도</h3>
          <div className="space-y-4">
            {data.data.campaignAnalysis.map((campaign: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{campaign.campaign}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.impact === 'low' ? 'bg-green-100 text-green-800' :
                    campaign.impact === 'high' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {campaign.impact} 영향
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">내부 트래픽:</span>
                    <span className="ml-1 font-medium">{campaign.internalPercentage.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">전환율 차이:</span>
                    <span className="ml-1 font-medium text-green-600">
                      +{((campaign.metricsWithoutInternal.conversionRate - campaign.metricsWithInternal.conversionRate) * 100).toFixed(1)}%p
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">세션 시간 차이:</span>
                    <span className="ml-1 font-medium text-blue-600">
                      +{campaign.metricsWithoutInternal.avgSessionDuration - campaign.metricsWithInternal.avgSessionDuration}초
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 검색어 순위 추적 뷰
function KeywordRankingView({ data }: { data: any }) {
  if (!data) return <div className="card">데이터를 로딩 중입니다...</div>

  return (
    <div className="space-y-6">
      {/* 순위 변동 요약 */}
      {data.data?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900">상승 키워드</h4>
            <p className="text-2xl font-bold text-green-600">{data.data.overview.improvingKeywords}</p>
          </div>
          <div className="card bg-red-50 border-red-200">
            <h4 className="font-semibold text-red-900">하락 키워드</h4>
            <p className="text-2xl font-bold text-red-600">{data.data.overview.decliningKeywords}</p>
          </div>
          <div className="card bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900">1-3위 키워드</h4>
            <p className="text-2xl font-bold text-blue-600">{data.data.overview.topRankingKeywords}</p>
          </div>
          <div className="card bg-purple-50 border-purple-200">
            <h4 className="font-semibold text-purple-900">평균 순위</h4>
            <p className="text-2xl font-bold text-purple-600">{data.data.overview.avgPosition?.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* 순위 변동 테이블 */}
      {data.data?.rankingChanges && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📈 검색어 순위 변동</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">키워드</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">현재 순위</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">순위 변동</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">클릭</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CTR</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">트렌드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.data.rankingChanges.slice(0, 10).map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">{item.keyword}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.position.toFixed(1)}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`flex items-center gap-1 ${
                        item.rankChange > 0 ? 'text-green-600' : 
                        item.rankChange < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {item.rankChange > 0 ? '↑' : item.rankChange < 0 ? '↓' : '→'}
                        {Math.abs(item.rankChange)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.clicks}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.ctr}%</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.trend.includes('up') ? 'bg-green-100 text-green-800' :
                        item.trend.includes('down') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.trend.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// 컨텐츠 드릴다운 뷰
function ContentDrilldownView({ data }: { data: any }) {
  if (!data) return <div className="card">데이터를 로딩 중입니다...</div>

  return (
    <div className="space-y-6">
      {/* 키워드 개요 */}
      {data.data?.overview && (
        <div className="card bg-gradient-to-r from-orange-50 to-yellow-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            🔍 "{data.keyword}" 키워드 분석
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.data.overview.totalPages}</div>
              <div className="text-sm text-gray-600">관련 페이지</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.data.overview.totalClicks}</div>
              <div className="text-sm text-gray-600">총 클릭</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.data.overview.avgPosition?.toFixed(1)}</div>
              <div className="text-sm text-gray-600">평균 순위</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{(data.data.overview.avgCTR * 100)?.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">평균 CTR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.data.overview.totalConversions}</div>
              <div className="text-sm text-gray-600">총 전환</div>
            </div>
          </div>
        </div>
      )}

      {/* 관련 페이지 성과 */}
      {data.data?.relatedPages && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📄 관련 페이지 성과</h3>
          <div className="space-y-4">
            {data.data.relatedPages.map((page: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{page.title}</h4>
                    <p className="text-sm text-gray-600">{page.url}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    page.pageType === 'product' ? 'bg-green-100 text-green-800' :
                    page.pageType === 'blog' ? 'bg-blue-100 text-blue-800' :
                    page.pageType === 'tutorial' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {page.pageType}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">순위:</span>
                    <span className="ml-1 font-medium">{page.position.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">클릭:</span>
                    <span className="ml-1 font-medium">{page.clicks}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CTR:</span>
                    <span className="ml-1 font-medium">{(page.ctr * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">전환율:</span>
                    <span className="ml-1 font-medium text-green-600">{(page.conversionRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최적화 기회 */}
      {data.data?.optimizationOpportunities && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 최적화 기회</h3>
          <div className="space-y-3">
            {data.data.optimizationOpportunities.slice(0, 5).map((opp: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                opp.type === 'ctr_optimization' ? 'bg-blue-50 border-blue-400' :
                opp.type === 'engagement_optimization' ? 'bg-yellow-50 border-yellow-400' :
                'bg-green-50 border-green-400'
              }`}>
                <h4 className="font-semibold text-gray-900">{opp.issue}</h4>
                <p className="text-sm text-gray-600 mt-1">{opp.title}</p>
                <p className="text-sm text-green-600 mt-1">{opp.potentialImprovement}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Tag Manager 분석 뷰
function TagManagerAnalysisView({ data }: { data: any }) {
  if (!data) return <div className="card">데이터를 로딩 중입니다...</div>

  return (
    <div className="space-y-6">
      {/* GTM 개요 */}
      {data.data?.summary && (
        <div className="card bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🏷️ Google Tag Manager 개요</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.data.summary.totalTags}</div>
              <div className="text-sm text-gray-600">총 태그</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.data.summary.totalTriggers}</div>
              <div className="text-sm text-gray-600">총 트리거</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.data.summary.totalVariables}</div>
              <div className="text-sm text-gray-600">총 변수</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.data.summary.utmRelatedItems}</div>
              <div className="text-sm text-gray-600">UTM 관련</div>
            </div>
          </div>
        </div>
      )}

      {/* 헬스 상태 */}
      {data.data?.healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🔍 태그 상태</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">활성 태그</span>
                <span className="font-medium text-green-600">{data.data.healthStatus.activeTags}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">일시정지 태그</span>
                <span className="font-medium text-red-600">{data.data.healthStatus.pausedTags}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">⚡ 트리거 상태</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">활성 트리거</span>
                <span className="font-medium text-green-600">{data.data.healthStatus.activeTriggers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">일시정지 트리거</span>
                <span className="font-medium text-red-600">{data.data.healthStatus.pausedTriggers}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 헬스 점수 */}
      {data.data?.healthStatus?.overallHealth && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">📊 전체 헬스 점수</h3>
              <p className="text-gray-600">GTM 설정의 전반적인 상태</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-green-600">{data.data.healthStatus.overallHealth}</div>
              <div className="text-sm text-green-600">/ 100점</div>
            </div>
          </div>
        </div>
      )}

      {/* 트리거 분석 */}
      {data.data?.utmRelated && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 UTM 관련 트리거</h3>
          <div className="space-y-3">
            {data.data.utmRelated.map((trigger: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{trigger.name}</h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {trigger.type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trigger.conditions.map((condition: string, i: number) => (
                    <span key={i} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 태그 분석 */}
      {data.data?.utmTracking && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 UTM 추적 태그</h3>
          <div className="space-y-3">
            {data.data.utmTracking.map((tag: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{tag.name}</h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {tag.type}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  추적 파라미터: {tag.utmParameters.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 성능 분석 */}
      {data.data?.recommendations && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 최적화 권장사항</h3>
          <div className="space-y-4">
            {data.data.recommendations.map((rec: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{rec.description}</p>
                <p className="text-sm text-green-600">{rec.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 변수 분석 */}
      {data.data?.utmVariables && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 UTM 관련 변수</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.utmVariables.map((variable: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900">{variable.name}</h4>
                <p className="text-sm text-gray-600">{variable.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 인사이트 */}
      {data.data?.insights && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">🔍 인사이트</h3>
          <div className="space-y-3">
            {data.data.insights.map((insight: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg ${
                insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                insight.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}