'use client'

import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface KeywordCohortAnalysisProps {
  propertyId?: string
}

interface KeywordCohortData {
  cohortDate: string
  keyword: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  initialUsers: number
  retentionWeek1: number
  retentionWeek2: number
  retentionWeek4: number
  retentionWeek8: number
  conversions: number
  revenue: number
  group?: string
}

interface KeywordGroup {
  id: string
  name: string
  keywords: string[]
  color: string
  description: string
  createdAt: string
}

export default function KeywordCohortAnalysis({ propertyId = '464147982' }: KeywordCohortAnalysisProps) {
  const [cohortData, setCohortData] = useState<KeywordCohortData[]>([])
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all')
  const [dateRange, setDateRange] = useState('7daysAgo')
  const [isLoading, setIsLoading] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [sortColumn, setSortColumn] = useState<string>('impressions')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // 그룹 관리 상태
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [latestInsight, setLatestInsight] = useState<any>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [promptTemplates, setPromptTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    loadCohortData()
    loadKeywordGroups()
    fetchLatestInsight()
    fetch('/api/ai-insight/models')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setAvailableModels(result.models)
          if (result.models.length > 0) setSelectedModel(result.models[0].id)
        }
      })
    fetch('/api/settings/prompt-templates?type=keyword-cohort-insight')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPromptTemplates(result.templates)
          const defaultTemplate = result.templates.find((t: any) => t.isDefault)
          if (defaultTemplate) setSelectedTemplate(defaultTemplate.id)
        }
      })
  }, [propertyId, dateRange])

  useEffect(() => {
    assignKeywordsToGroups()
  }, [cohortData, keywordGroups])

  const loadCohortData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/analytics/keyword-cohort?propertyId=${propertyId}&period=${dateRange}`
      )

      if (!response.ok) {
        throw new Error('Failed to load keyword cohort data')
      }

      const result = await response.json()
      setCohortData(result.cohorts || [])
      // Make sure 'all' is not duplicated if already present
      setKeywords(keywords => {
        const newKeywords = Array.from(new Set(['all', ...result.keywords]));
        return newKeywords;
      });
      setLastUpdate(result.lastUpdate)

      toast.success(result.message || '검색어 코호트 데이터 로드 완료')
    } catch (error) {
      console.error('Keyword cohort data error:', error)
      toast.error('검색어 코호트 데이터 로드 실패.')
      setCohortData([])
      setKeywords(['all'])
    } finally {
      setIsLoading(false)
    }
  }


  const assignKeywordsToGroups = () => {
    const updatedCohortData = cohortData.map(cohort => {
      const matchedGroup = keywordGroups.find(group =>
        group.keywords.some(groupKeyword =>
          cohort.keyword.toLowerCase().includes(groupKeyword.toLowerCase())
        )
      )
      return {
        ...cohort,
        group: matchedGroup?.id || 'ungrouped'
      }
    })

    if (JSON.stringify(updatedCohortData) !== JSON.stringify(cohortData)) {
      console.log('[DEBUG] assignKeywordsToGroups - 그룹 할당됨:', updatedCohortData);
      setCohortData(updatedCohortData)
    }
  }

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    keywords: '',
    color: 'bg-blue-100 text-blue-800'
  });

  const addKeywordGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      toast.error('그룹명을 입력해주세요.');
      return;
    }

    const keywordArray = newGroupData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordArray.length === 0) {
      toast.error('키워드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          group: {
            name: newGroupData.name.trim(),
            description: newGroupData.description.trim(),
            color: newGroupData.color,
            keywords: keywordArray
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(prev => [...prev, result.group])
          setNewGroupData({
            name: '',
            description: '',
            keywords: '',
            color: 'bg-blue-100 text-blue-800'
          });
          setShowCreateGroupModal(false);
          toast.success(`'${newGroupData.name}' 그룹이 생성되었습니다.`);
        } else {
          toast.error(result.message || '그룹 생성에 실패했습니다.');
        }
      } else {
        toast.error('그룹 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Create group error:', error)
      toast.error('그룹 생성 중 오류가 발생했습니다.');
    }
  };

  const deleteKeywordGroup = async (groupId: string) => {
    try {
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          group: { id: groupId }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(prev => prev.filter(g => g.id !== groupId))
          if (selectedGroup === groupId) {
            setSelectedGroup('all')
          }
          toast.success('키워드 그룹이 삭제되었습니다')
        } else {
          toast.error(result.message || '그룹 삭제에 실패했습니다.');
        }
      } else {
        toast.error('그룹 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete group error:', error)
      toast.error('그룹 삭제 중 오류가 발생했습니다.');
    }
  }

  const addKeywordToGroup = async (groupId: string, keyword: string) => {
    try {
      const group = keywordGroups.find(g => g.id === groupId)
      if (!group) return

      const updatedKeywords = Array.from(new Set([...group.keywords, keyword]))
      
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          group: {
            id: groupId,
            name: group.name,
            description: group.description,
            color: group.color,
            keywords: updatedKeywords
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(groups => 
            groups.map(group =>
              group.id === groupId
                ? { ...group, keywords: updatedKeywords }
                : group
            )
          )
          setSearchTerms({ ...searchTerms, [groupId]: '' });
          setOpenDropdownId(null);
          toast.success(`'${keyword}' 키워드가 그룹에 추가되었습니다.`)
        } else {
          toast.error(result.message || '키워드 추가에 실패했습니다.');
        }
      } else {
        toast.error('키워드 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Add keyword error:', error)
      toast.error('키워드 추가 중 오류가 발생했습니다.');
    }
  }

  const removeKeywordFromGroup = async (groupId: string, keyword: string) => {
    try {
      const group = keywordGroups.find(g => g.id === groupId)
      if (!group) return

      const updatedKeywords = group.keywords.filter(k => k !== keyword)
      
      const response = await fetch('/api/analytics/keyword-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          group: {
            id: groupId,
            name: group.name,
            description: group.description,
            color: group.color,
            keywords: updatedKeywords
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(groups =>
            groups.map(group =>
              group.id === groupId
                ? { ...group, keywords: updatedKeywords }
                : group
            )
          )
          toast.success('키워드가 그룹에서 제거되었습니다')
        } else {
          toast.error(result.message || '키워드 제거에 실패했습니다.');
        }
      } else {
        toast.error('키워드 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('Remove keyword error:', error)
      toast.error('키워드 제거 중 오류가 발생했습니다.');
    }
  }

  const getFilteredCohortData = () => {
    let filtered = cohortData;
    if (selectedGroup !== 'all') {
      if (selectedGroup === 'ungrouped') {
        filtered = filtered.filter(d => d.group === 'ungrouped');
      } else {
        filtered = filtered.filter(d => d.group === selectedGroup);
      }
    }
    if (selectedKeyword !== 'all') {
      filtered = filtered.filter(cohort => cohort.keyword === selectedKeyword);
    }
    const uniqueKeywords = Array.from(new Set(filtered.map(d => d.keyword)))
    const aggregatedData = uniqueKeywords.map(keyword => {
      const keywordData = filtered.filter(d => d.keyword === keyword);
      return keywordData.reduce((acc, curr) => {
        return {
          ...acc,
          impressions: acc.impressions + curr.impressions,
          clicks: acc.clicks + curr.clicks,
          conversions: acc.conversions + curr.conversions,
          initialUsers: acc.initialUsers + curr.initialUsers,
          retentionWeek1: acc.retentionWeek1 + curr.retentionWeek1,
          retentionWeek2: acc.retentionWeek2 + curr.retentionWeek2,
          retentionWeek4: acc.retentionWeek4 + curr.retentionWeek4,
          retentionWeek8: acc.retentionWeek8 + curr.retentionWeek8,
          revenue: acc.revenue + curr.revenue
        };
      }, {
        keyword: keyword,
        group: keywordData[0]?.group,
        cohortDate: '',
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: keywordData.reduce((sum, item) => sum + item.position, 0) / keywordData.length,
        initialUsers: 0,
        retentionWeek1: 0,
        retentionWeek2: 0,
        retentionWeek4: 0,
        retentionWeek8: 0,
        conversions: 0,
        revenue: 0,
      });
    });
    aggregatedData.forEach(d => {
      d.ctr = d.impressions > 0 ? d.clicks / d.impressions : 0;
    });
    // 정렬
    const compare = (a: any, b: any) => {
      let v1 = a[sortColumn], v2 = b[sortColumn];
      
      // 특수 처리가 필요한 컬럼들
      switch (sortColumn) {
        case 'ctr':
          v1 = a.ctr; v2 = b.ctr;
          break;
        case 'position':
          v1 = a.position; v2 = b.position;
          break;
        case 'keyword':
          v1 = a.keyword; v2 = b.keyword;
          break;
        case 'impressions':
          v1 = a.impressions; v2 = b.impressions;
          break;
        case 'clicks':
          v1 = a.clicks; v2 = b.clicks;
          break;
        case 'initialUsers':
          v1 = a.initialUsers; v2 = b.initialUsers;
          break;
        case 'retentionWeek1':
          v1 = a.retentionWeek1; v2 = b.retentionWeek1;
          break;
        case 'retentionWeek2':
          v1 = a.retentionWeek2; v2 = b.retentionWeek2;
          break;
        case 'retentionWeek4':
          v1 = a.retentionWeek4; v2 = b.retentionWeek4;
          break;
        case 'retentionWeek8':
          v1 = a.retentionWeek8; v2 = b.retentionWeek8;
          break;
        case 'conversions':
          v1 = a.conversions; v2 = b.conversions;
          break;
        case 'revenue':
          v1 = a.revenue; v2 = b.revenue;
          break;
        default:
          v1 = a[sortColumn]; v2 = b[sortColumn];
      }
      
      // 문자열 비교
      if (typeof v1 === 'string') {
        return sortDirection === 'asc' ? v1.localeCompare(v2) : v2.localeCompare(v1);
      }
      
      // 숫자 비교 (null/undefined 처리)
      if (v1 == null) v1 = 0;
      if (v2 == null) v2 = 0;
      return sortDirection === 'asc' ? v1 - v2 : v2 - v1;
    };
    return aggregatedData.sort(compare);
  }

  const getGroupSummary = () => {
    const summary: { [key: string]: any } = {}

    keywordGroups.forEach(group => {
      summary[group.id] = { name: group.name, color: group.color, keywordCount: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalInitialUsers: 0, totalRetention: 0 }
    })
    summary['ungrouped'] = { name: '미분류', color: 'bg-gray-100 text-gray-800', keywordCount: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalInitialUsers: 0, totalRetention: 0 }

    const uniqueKeywords = Array.from(new Set(cohortData.map(d => d.keyword)));

    uniqueKeywords.forEach(keyword => {
      const keywordData = cohortData.filter(d => d.keyword === keyword);
      const group = keywordData[0]?.group || 'ungrouped';

      if (summary[group]) {
        summary[group].keywordCount++;
        keywordData.forEach(d => {
          summary[group].totalImpressions += d.impressions;
          summary[group].totalClicks += d.clicks;
          summary[group].totalConversions += d.conversions;
          summary[group].totalInitialUsers += d.initialUsers;
          summary[group].totalRetention += d.retentionWeek4;
        });
      }
    });

    Object.keys(summary).forEach(key => {
      if (summary[key].totalInitialUsers > 0) {
        summary[key].avgRetention = summary[key].totalRetention / summary[key].totalInitialUsers;
      } else {
        summary[key].avgRetention = 0;
      }
    });

    return summary;
  }


  const getPerformanceColor = (value: number, type: 'ctr' | 'position' | 'retention') => {
    if (type === 'position') {
      if (value <= 3) return 'text-green-500'
      if (value <= 10) return 'text-yellow-500'
      return 'text-red-500'
    } else if (type === 'ctr') {
      if (value >= 0.05) return 'text-green-500'
      if (value >= 0.02) return 'text-yellow-500'
      return 'text-red-500'
    } else { // retention
      if (value >= 0.1) return 'text-green-500'
      if (value >= 0.05) return 'text-yellow-500'
      return 'text-red-500'
    }
  }

  const getRetentionBarColor = (rate: number) => {
    if (rate >= 0.1) return 'bg-green-400'
    if (rate >= 0.05) return 'bg-yellow-400'
    return 'bg-red-400'
  }

  const keywordSummary = getFilteredCohortData().reduce(
    (acc, curr) => {
      acc.totalImpressions += curr.impressions
      acc.totalClicks += curr.clicks
      acc.totalConversions += curr.conversions
      acc.totalRevenue += curr.revenue
      return acc
    },
    { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 }
  )

  const handleRefresh = () => {
    toast.success('데이터를 새로고침합니다.')
    loadCohortData()
  }

  const handleUpdateData = async () => {
    setIsUpdating(true)
    try {
      toast.loading('키워드 데이터를 업데이트하는 중...', { duration: 3000 })
      
      const response = await fetch(
        `/api/analytics/keyword-cohort`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId })
        }
      )

      const result = await response.json()
      
      if (response.ok) {
        toast.success(result.message)
        // 업데이트 후 데이터 다시 로드
        await loadCohortData()
      } else {
        toast.error(result.error || '데이터 업데이트 실패')
      }
    } catch (error) {
      console.error('Data update error:', error)
      toast.error('데이터 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatLastUpdate = (dateString: string | null) => {
    if (!dateString) return '업데이트 기록 없음'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const loadKeywordGroups = async () => {
    try {
      const response = await fetch('/api/analytics/keyword-groups')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKeywordGroups(result.groups)
        } else {
          // 기본 그룹 설정
          setKeywordGroups([
            {
              id: '1',
              name: '브랜드 검색어',
              keywords: ['rtm', 'rtm.ai', '알티엠', 'RTM'],
              color: 'bg-blue-100 text-blue-800',
              description: '회사명 및 브랜드 관련 검색어',
              createdAt: new Date().toISOString()
            },
            {
              id: '2',
              name: '제품/기능 관련',
              keywords: ['analytics', 'dashboard', 'utm', 'tracking', '분석', '대시보드'],
              color: 'bg-green-100 text-green-800',
              description: '제품 기능 및 관련 용어 검색어',
              createdAt: new Date().toISOString()
            },
            {
              id: '3',
              name: '경쟁사/비교',
              keywords: ['vs', 'compare', '비교', 'alternative', '대안'],
              color: 'bg-purple-100 text-purple-800',
              description: '경쟁사 비교 및 대안 검색어',
              createdAt: new Date().toISOString()
            }
          ])
        }
      }
    } catch (error) {
      console.error('Failed to load keyword groups:', error)
      // 기본 그룹 설정
      setKeywordGroups([
        {
          id: '1',
          name: '브랜드 검색어',
          keywords: ['rtm', 'rtm.ai', '알티엠', 'RTM'],
          color: 'bg-blue-100 text-blue-800',
          description: '회사명 및 브랜드 관련 검색어',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: '제품/기능 관련',
          keywords: ['analytics', 'dashboard', 'utm', 'tracking', '분석', '대시보드'],
          color: 'bg-green-100 text-green-800',
          description: '제품 기능 및 관련 용어 검색어',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '경쟁사/비교',
          keywords: ['vs', 'compare', '비교', 'alternative', '대안'],
          color: 'bg-purple-100 text-purple-800',
          description: '경쟁사 비교 및 대안 검색어',
          createdAt: new Date().toISOString()
        }
      ])
    }
  }

  // 인사이트 조회
  const fetchLatestInsight = async () => {
    const res = await fetch(`/api/ai-insight?type=keyword-cohort&propertyId=${propertyId}`)
    const result = await res.json()
    if (result.success && result.insight) setLatestInsight(result.insight)
    else setLatestInsight(null)
  }

  const handleGenerateInsight = async () => {
    setInsightLoading(true)
    try {
      const requestBody: any = {
        model: selectedModel,
        type: 'keyword-cohort',
        propertyId
      }

      if (selectedTemplate) {
        requestBody.templateId = selectedTemplate
        requestBody.variables = {
          dateRange
        }
      } else {
        requestBody.prompt = `다음은 키워드 코호트 분석 주요 데이터입니다.\n\n` +
          `기간: ${dateRange}\n` +
          `주요 검색어별 노출, 클릭, 전환, 리텐션 등 지표를 바탕으로 3가지 인사이트와 2가지 개선 제안을 한국어로 요약해줘.`
      }

      const res = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const result = await res.json()
      if (result.success) {
        fetchLatestInsight()
      } else {
        toast.error('AI 인사이트 생성 실패: ' + (result.error || ''))
      }
    } catch (e:any) {
      toast.error('AI 인사이트 생성 중 오류: ' + (e.message || ''))
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">키워드 코호트 분석</h1>
            <p className="text-sm text-gray-600">
              마지막 업데이트: {formatLastUpdate(lastUpdate)} 
              {lastUpdate && <span className="text-gray-400 ml-1">(매일 9시 자동 업데이트)</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="7daysAgo">최근 7일</option>
              <option value="30daysAgo">최근 30일</option>
              <option value="90daysAgo">최근 90일</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md hover:bg-gray-100"
              title="데이터 새로고침"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Google Search Console에서 최신 데이터 가져오기"
            >
              {isUpdating ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  업데이트 중...
                </>
              ) : (
                '데이터 업데이트'
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border-gray-300 rounded-md text-sm shadow-sm"
            >
              <option value="all">모든 그룹</option>
              {keywordGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
              <option value="ungrouped">미분류</option>
            </select>
          </div>
        </div>
      </div>

      {/* Group Summary Cards */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">그룹별 성과 요약</h3>
          <button
            onClick={addKeywordGroup}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + 새 그룹 생성
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(getGroupSummary()).filter(([key, summary]) => key === 'ungrouped' ? (selectedGroup === 'ungrouped' && summary.keywordCount > 0) || (selectedGroup !== 'ungrouped' && summary.keywordCount > 0) : summary.keywordCount > 0).map(([groupId, summary]: [string, any]) => (
            <div
              key={groupId}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedGroup === groupId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${summary.color}`}
                  onClick={() => setSelectedGroup(groupId)}
                >
                  {summary.name}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">{summary.keywordCount}개</span>
                  {groupId !== 'ungrouped' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKeywordGroup(groupId);
                      }}
                      className="text-red-400 hover:text-red-600 text-xs ml-1"
                      title="그룹 삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-sm mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">총 노출:</span>
                  <span className="font-medium text-gray-900">{summary.totalImpressions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">총 클릭:</span>
                  <span className="font-medium text-gray-900">{summary.totalClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">총 전환:</span>
                  <span className="font-medium text-gray-900">{summary.totalConversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">평균 리텐션 (W4):</span>
                  <span className="font-medium text-gray-900">{(summary.avgRetention * 100).toFixed(1)}%</span>
                </div>
                
                {/* 키워드 목록 (접기/펼치기) */}
                {groupId !== 'ungrouped' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800 flex items-center justify-between">
                        <span>키워드 목록</span>
                        <span className="group-open:rotate-90 transform transition-transform">▶</span>
                      </summary>
                      <div className="mt-2 space-y-1">
                        {keywordGroups.find(g => g.id === groupId)?.keywords.map((keyword, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{keyword}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeKeywordFromGroup(groupId, keyword);
                              }}
                              className="text-red-400 hover:text-red-600 ml-1"
                              title="키워드 제거"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        
                        {/* 키워드 추가 입력 */}
                        <div className="mt-2 flex items-center space-x-1">
                          <input
                            type="text"
                            placeholder="키워드 추가"
                            value={searchTerms[groupId] || ''}
                            onChange={(e) => setSearchTerms({...searchTerms, [groupId]: e.target.value})}
                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && searchTerms[groupId]?.trim()) {
                                addKeywordToGroup(groupId, searchTerms[groupId].trim());
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (searchTerms[groupId]?.trim()) {
                                addKeywordToGroup(groupId, searchTerms[groupId].trim());
                              }
                            }}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Cohort Table */}
      <div className="mt-8 w-full overflow-x-auto px-4">
        <table className="min-w-[1200px] divide-y divide-gray-300 text-xs">
          <thead>
            <tr>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('keyword')}
              >
                <div className="flex items-center">
                  키워드
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'keyword' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('impressions')}
              >
                <div className="flex items-center">
                  노출
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'impressions' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('clicks')}
              >
                <div className="flex items-center">
                  클릭
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'clicks' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('ctr')}
              >
                <div className="flex items-center">
                  CTR
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'ctr' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('position')}
              >
                <div className="flex items-center">
                  순위
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'position' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('initialUsers')}
              >
                <div className="flex items-center">
                  초기 사용자
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'initialUsers' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('retentionWeek1')}
              >
                <div className="flex items-center">
                  리텐션(1주)
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'retentionWeek1' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('retentionWeek4')}
              >
                <div className="flex items-center">
                  리텐션(4주)
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'retentionWeek4' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center">
                  수익
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'revenue' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th 
                className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap cursor-pointer hover:bg-gray-50 select-none"
                onClick={() => handleSort('conversions')}
              >
                <div className="flex items-center">
                  전환
                  <span className="ml-1 text-gray-400">
                    {sortColumn === 'conversions' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">그룹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {getFilteredCohortData().slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((item) => (
              <tr key={item.keyword}>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{item.keyword}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{item.impressions.toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{item.clicks.toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  <span className={getPerformanceColor(item.ctr, 'ctr')}>
                    {(item.ctr * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  <span className={getPerformanceColor(item.position, 'position')}>
                    {item.position.toFixed(1)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{item.initialUsers.toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={getRetentionBarColor(item.retentionWeek1 / (item.initialUsers || 1)) + " h-3 rounded-full"} style={{ width: `${Math.min(100, (item.retentionWeek1 / (item.initialUsers || 1)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {item.initialUsers > 0 ? ((item.retentionWeek1 / item.initialUsers) * 100).toFixed(1) : '0.0'}%
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={getRetentionBarColor(item.retentionWeek4 / (item.initialUsers || 1)) + " h-3 rounded-full"} style={{ width: `${Math.min(100, (item.retentionWeek4 / (item.initialUsers || 1)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {item.initialUsers > 0 ? ((item.retentionWeek4 / item.initialUsers) * 100).toFixed(1) : '0.0'}%
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                  <span className="text-green-600 font-medium">₩{item.revenue.toLocaleString()}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{item.conversions.toLocaleString()}</td>
                <td className="whitespace-nowrap px-3 py-2 text-sm">
                  {item.group && keywordGroups.find(g => g.id === item.group) && item.group !== 'ungrouped' ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${keywordGroups.find(g => g.id === item.group)?.color}`}>
                      {keywordGroups.find(g => g.id === item.group)?.name}
                    </span>
                  ) : (
                    <select
                      className="border-gray-300 rounded-md text-xs"
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) addKeywordToGroup(e.target.value, item.keyword)
                      }}
                    >
                      <option value="">그룹 등록</option>
                      {keywordGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination */}
        <div className="flex justify-end items-center mt-4 space-x-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-sm border rounded disabled:opacity-50">이전</button>
          <span className="text-sm">{currentPage} / {Math.ceil(getFilteredCohortData().length / rowsPerPage)}</span>
          <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredCohortData().length / rowsPerPage), p + 1))} disabled={currentPage === Math.ceil(getFilteredCohortData().length / rowsPerPage)} className="px-2 py-1 text-sm border rounded disabled:opacity-50">다음</button>
        </div>
      </div>

      {/* AI 인사이트 섹션 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center mb-2">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-primary-600" />
          <span className="font-bold text-primary-700 text-lg">AI 자동 인사이트</span>
          {latestInsight?.createdAt && (
            <span className="ml-3 text-xs text-gray-500">{new Date(latestInsight.createdAt).toLocaleString('ko-KR')}</span>
          )}
          <div className="ml-auto flex items-center space-x-2">
            {availableModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 Gemini 모델 선택"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            )}
            {promptTemplates.length > 0 && (
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="rounded-md border border-primary-300 text-sm px-2 py-1 focus:ring-primary-500"
                title="사용할 프롬프트 템플릿 선택"
              >
                <option value="">기본 프롬프트</option>
                {promptTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleGenerateInsight}
              disabled={insightLoading || !selectedModel}
              className="inline-flex items-center px-3 py-1 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {insightLoading ? 'AI 분석 중...' : 'AI 인사이트'}
            </button>
          </div>
        </div>
        <div className="whitespace-pre-line text-gray-800 text-sm min-h-[60px]">
          {latestInsight?.result ? latestInsight.result : '아직 생성된 인사이트가 없습니다.'}
        </div>
        {latestInsight?.model && (
          <div className="mt-2 text-xs text-gray-500">모델: {latestInsight.model}</div>
        )}
      </div>

      {/* 그룹 생성 모달 */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 키워드 그룹 생성</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    그룹명 *
                  </label>
                  <input
                    type="text"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 브랜드 검색어"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="그룹에 대한 간단한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    키워드 (쉼표로 구분)
                  </label>
                  <textarea
                    value={newGroupData.keywords}
                    onChange={(e) => setNewGroupData({...newGroupData, keywords: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="rtm, analytics, 대시보드, 분석도구"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    색상
                  </label>
                  <select
                    value={newGroupData.color}
                    onChange={(e) => setNewGroupData({...newGroupData, color: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bg-blue-100 text-blue-800">파란색</option>
                    <option value="bg-green-100 text-green-800">초록색</option>
                    <option value="bg-purple-100 text-purple-800">보라색</option>
                    <option value="bg-red-100 text-red-800">빨간색</option>
                    <option value="bg-yellow-100 text-yellow-800">노란색</option>
                    <option value="bg-indigo-100 text-indigo-800">인디고색</option>
                    <option value="bg-pink-100 text-pink-800">분홍색</option>
                    <option value="bg-gray-100 text-gray-800">회색</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}