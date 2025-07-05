'use client'

import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  ChartBarIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface Report {
  id: string
  title: string
  startDate: string
  endDate: string
  totalSessions: number
  totalUsers: number
  totalConversions: number
  avgEngagementRate: number
  createdAt: string
  propertyId: string
  isTest: boolean
  hasAI: boolean
  selectedModel?: string
  detail?: any
}

interface ReportManagerProps {
  propertyId?: string
}

export default function ReportManager({ propertyId = '464147982' }: ReportManagerProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    loadReports()
  }, [currentPage, propertyId])

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/weekly-report/list?page=${currentPage}&limit=10&propertyId=${propertyId}`
      )
      const result = await response.json()

      if (result.success) {
        setReports(result.data.reports)
        setTotalPages(result.data.pagination.totalPages)
        setTotalCount(result.data.pagination.totalCount)
      } else {
        toast.error('보고서 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, propertyId])

  const downloadReport = async (reportId: string, format: 'json' | 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/weekly-report/download/${reportId}?format=${format}`)

      if (response.ok) {
        if (format === 'json') {
          const data = await response.json()
          // JSON 파일로 다운로드
          const blob = new Blob([JSON.stringify(data.report, null, 2)], {
            type: 'application/json',
          })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `report_${reportId}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          // CSV/PDF 파일 다운로드
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `report_${reportId}.${format}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }

        toast.success(`${format.toUpperCase()} 형식으로 다운로드되었습니다.`)
      } else {
        toast.error('다운로드에 실패했습니다.')
      }
    } catch (error) {
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  const viewReportDetail = async (report: Report) => {
    try {
      const response = await fetch(`/api/weekly-report/download/${report.id}?format=json`)
      if (response.ok) {
        const result = await response.json()
        setSelectedReport({ ...report, detail: result.report })
        setShowDetail(true)
      } else {
        toast.error('보고서 상세 정보를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      toast.error('보고서 상세 정보 로드 중 오류가 발생했습니다.')
    }
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('정말로 이 보고서를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/weekly-report/delete/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('보고서가 삭제되었습니다.')
        loadReports() // 목록 새로고침
      } else {
        const result = await response.json()
        toast.error(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      toast.error('삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-2" />
            주간 분석 보고서 관리
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            생성된 주간 분석 보고서를 확인하고 다운로드할 수 있습니다.
          </p>
        </div>
        <div className="text-sm text-gray-500">총 {totalCount}개의 보고서</div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">보고서가 없습니다</h3>
            <p className="text-gray-500">아직 생성된 주간 분석 보고서가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    보고서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메트릭
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {report.title}
                            {report.isTest && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                테스트
                              </span>
                            )}
                            {report.hasAI && (
                              <SparklesIcon
                                className="ml-2 h-4 w-4 text-purple-500"
                                title="AI 분석 포함"
                              />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.selectedModel && (
                              <span className="inline-flex items-center">
                                <InformationCircleIcon className="h-3 w-3 mr-1" />
                                {report.selectedModel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(report.startDate)} ~ {formatDate(report.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          {report.totalSessions.toLocaleString()} 세션
                        </div>
                        <div className="text-xs text-gray-500">
                          {report.totalUsers.toLocaleString()} 사용자, {report.totalConversions}{' '}
                          전환
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewReportDetail(report)}
                          className="text-blue-600 hover:text-blue-900"
                          title="상세 보기"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <div className="relative group">
                          <button className="text-green-600 hover:text-green-900" title="다운로드">
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => downloadReport(report.id, 'json')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                JSON 다운로드
                              </button>
                              <button
                                onClick={() => downloadReport(report.id, 'csv')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                CSV 다운로드
                              </button>
                              <button
                                onClick={() => downloadReport(report.id, 'pdf')}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                PDF 다운로드
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showDetail && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">보고서 상세 정보</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">닫기</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="font-medium text-gray-900">기본 정보</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    <strong>제목:</strong> {selectedReport.title}
                  </p>
                  <p>
                    <strong>기간:</strong> {formatDate(selectedReport.startDate)} ~{' '}
                    {formatDate(selectedReport.endDate)}
                  </p>
                  <p>
                    <strong>생성일:</strong> {formatDateTime(selectedReport.createdAt)}
                  </p>
                  <p>
                    <strong>AI 모델:</strong> {selectedReport.selectedModel || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedReport.detail && (
                <div>
                  <h4 className="font-medium text-gray-900">AI 분석 결과</h4>
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedReport.detail.data?.aiAnalysis ? (
                      <div className="space-y-2">
                        <div>
                          <strong>주요 인사이트:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {selectedReport.detail.data.aiAnalysis.insights?.map(
                              (insight: string, index: number) => (
                                <li key={index}>{insight}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <strong>개선 권장사항:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {selectedReport.detail.data.aiAnalysis.recommendations?.map(
                              (rec: string, index: number) => (
                                <li key={index}>{rec}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p>AI 분석이 포함되지 않았습니다.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
