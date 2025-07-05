'use client'

import {
  CheckIcon,
  ClipboardIcon,
  DocumentArrowUpIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import Papa from 'papaparse'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'

interface UTMFormData {
  name: string
  baseUrl: string
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
  description?: string
}

export default function UTMBuilder() {
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UTMFormData>()

  const watchedValues = watch()

  // 실시간 URL 생성
  const generateUrl = (data: Partial<UTMFormData>) => {
    if (!data.baseUrl || !data.source || !data.medium || !data.campaign) {
      return ''
    }

    const url = new URL(data.baseUrl)
    const params = new URLSearchParams()

    params.set('utm_source', data.source)
    params.set('utm_medium', data.medium)
    params.set('utm_campaign', data.campaign)

    if (data.term) params.set('utm_term', data.term)
    if (data.content) params.set('utm_content', data.content)

    return `${url.origin}${url.pathname}${url.search ? '&' : '?'}${params.toString()}`
  }

  // 실시간으로 URL 업데이트
  const previewUrl = generateUrl(watchedValues)

  const onSubmit = async (data: UTMFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/utm/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          url: generateUrl(data),
        }),
      })

      if (response.ok) {
        const savedCampaign = await response.json()
        setGeneratedUrl(savedCampaign.url)
        toast.success('UTM 캠페인이 저장되었습니다!')
        reset()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '캠페인 저장에 실패했습니다.')
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data)
        const validationErrors = validateCsvData(results.data)
        if (validationErrors.length > 0) {
          setCsvErrors(validationErrors)
          toast.error('CSV 파일에 오류가 있습니다.')
        } else {
          setCsvErrors([])
          toast.success('CSV 파일이 유효합니다. 업로드할 수 있습니다.')
        }
      },
      error: (error: any) => {
        toast.error(`CSV 파싱 오류: ${error.message}`)
      },
    })
  }

  const validateCsvData = (data: any[]): string[] => {
    const errors: string[] = []
    const requiredFields = ['name', 'baseUrl', 'source', 'medium', 'campaign']
    data.forEach((row, index) => {
      for (const field of requiredFields) {
        if (!row[field]) {
          errors.push(`행 ${index + 2}: '${field}' 필드가 비어있습니다.`)
        }
      }
    })
    return errors
  }

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) {
      toast.error('업로드할 데이터가 없습니다.')
      return
    }
    if (csvErrors.length > 0) {
      toast.error('파일의 오류를 수정해주세요.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/utm/campaigns/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(csvData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.createdCount}개의 캠페인이 성공적으로 등록되었습니다.`)
        setCsvData([])
        setCsvErrors([])
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '일괄 등록에 실패했습니다.')
      }
    } catch (error) {
      toast.error('일괄 등록 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('URL이 클립보드에 복사되었습니다!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }

  const commonSources = [
    'google',
    'facebook',
    'instagram',
    'youtube',
    'linkedin',
    'twitter',
    'newsletter',
    'blog',
  ]
  const commonMediums = [
    'cpc',
    'social',
    'email',
    'organic',
    'referral',
    'banner',
    'video',
    'affiliate',
  ]

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">UTM 링크 빌더</h2>
        </div>
        <button
          onClick={() => setIsBulkMode(!isBulkMode)}
          className="btn-secondary flex items-center gap-2"
        >
          {isBulkMode ? (
            <>
              <LinkIcon className="w-4 h-4" />
              개별 생성
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="w-4 h-4" />
              일괄 등록
            </>
          )}
        </button>
      </div>

      {!isBulkMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* UTM 제목 */}
            <div>
              <label className="label">UTM 제목 *</label>
              <input
                {...register('name', { required: 'UTM 제목을 입력해주세요' })}
                className="input-field"
                placeholder="예: 2024년 여름 세일 프로모션"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* 기본 URL */}
            <div>
              <label className="label">기본 URL *</label>
              <input
                type="url"
                {...register('baseUrl', {
                  required: '기본 URL을 입력해주세요',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: '올바른 URL 형식을 입력해주세요 (http:// 또는 https://)',
                  },
                })}
                className="input-field"
                placeholder="https://www.example.com"
              />
              {errors.baseUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.baseUrl.message}</p>
              )}
            </div>

            {/* UTM Source */}
            <div>
              <label className="label">UTM Source *</label>
              <input
                {...register('source', { required: 'UTM Source를 입력해주세요' })}
                className="input-field"
                placeholder="google, facebook, newsletter"
                list="sources"
              />
              <datalist id="sources">
                {commonSources.map((source) => (
                  <option key={source} value={source} />
                ))}
              </datalist>
              {errors.source && (
                <p className="text-red-500 text-sm mt-1">{errors.source.message}</p>
              )}
            </div>

            {/* UTM Medium */}
            <div>
              <label className="label">UTM Medium *</label>
              <input
                {...register('medium', { required: 'UTM Medium을 입력해주세요' })}
                className="input-field"
                placeholder="cpc, social, email"
                list="mediums"
              />
              <datalist id="mediums">
                {commonMediums.map((medium) => (
                  <option key={medium} value={medium} />
                ))}
              </datalist>
              {errors.medium && (
                <p className="text-red-500 text-sm mt-1">{errors.medium.message}</p>
              )}
            </div>

            {/* UTM Campaign */}
            <div>
              <label className="label">UTM Campaign *</label>
              <input
                {...register('campaign', { required: 'UTM Campaign을 입력해주세요' })}
                className="input-field"
                placeholder="summer_sale, brand_awareness"
              />
              {errors.campaign && (
                <p className="text-red-500 text-sm mt-1">{errors.campaign.message}</p>
              )}
            </div>

            {/* UTM Term */}
            <div>
              <label className="label">UTM Term (선택사항)</label>
              <input
                {...register('term')}
                className="input-field"
                placeholder="키워드 (주로 유료 검색에서 사용)"
              />
            </div>

            {/* UTM Content */}
            <div>
              <label className="label">UTM Content (선택사항)</label>
              <input
                {...register('content')}
                className="input-field"
                placeholder="광고 콘텐츠 구분 (A/B 테스트 등)"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="label">설명 (선택사항)</label>
              <input
                {...register('description')}
                className="input-field"
                placeholder="캠페인에 대한 간단한 설명"
              />
            </div>
          </div>

          {/* 실시간 미리보기 */}
          {previewUrl && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="label">생성된 URL 미리보기</label>
              <div className="flex items-center gap-2">
                <input type="text" value={previewUrl} readOnly className="input-field bg-white" />
                <button
                  type="button"
                  onClick={() => copyToClipboard(previewUrl)}
                  className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-4 h-4" />
                      복사
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => reset()} className="btn-secondary">
              초기화
            </button>
            <button
              type="submit"
              disabled={isLoading || !previewUrl}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '저장 중...' : '캠페인 저장'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">CSV 파일로 일괄 등록</h3>
            <p className="text-sm text-gray-600 mb-4">
              아래 형식에 맞는 CSV 파일을 업로드해주세요. 파일의 첫 행은 헤더여야 합니다.
            </p>
            <code className="text-xs bg-gray-200 p-2 rounded-md block whitespace-pre-wrap">
              name,baseUrl,source,medium,campaign,term,content,description
            </code>
            <div className="mt-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </div>

          {csvErrors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">CSV 파일 오류</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {csvErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {csvData.length > 0 && csvErrors.length === 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">
                미리보기 ({csvData.length}개 행)
              </h4>
              <div className="overflow-x-auto max-h-60 border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(csvData[0]).map((key) => (
                        <th key={key} className="p-2 text-left font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="p-2 whitespace-nowrap">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">... 외 {csvData.length - 5}개 행</p>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleBulkSubmit}
              disabled={isLoading || csvData.length === 0 || csvErrors.length > 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowUpIcon className="w-5 h-5" />
              {isLoading ? '업로드 중...' : `${csvData.length}개 캠페인 업로드`}
            </button>
          </div>
        </div>
      )}

      {/* UTM 파라미터 설명 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">UTM 파라미터 설명</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            <strong>utm_source:</strong> 트래픽 소스 (예: google, facebook, newsletter)
          </p>
          <p>
            <strong>utm_medium:</strong> 마케팅 매체 (예: cpc, social, email)
          </p>
          <p>
            <strong>utm_campaign:</strong> 캠페인 이름 (예: summer_sale, product_launch)
          </p>
          <p>
            <strong>utm_term:</strong> 키워드 (주로 유료 검색에서 사용)
          </p>
          <p>
            <strong>utm_content:</strong> 광고 콘텐츠 구분 (A/B 테스트에 유용)
          </p>
        </div>
      </div>
    </div>
  )
}
