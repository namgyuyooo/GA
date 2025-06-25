'use client'

import { ArrowLeftIcon, ChartBarIcon, ClockIcon, DevicePhoneMobileIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export default function SessionsAnalysis() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [period, setPeriod] = useState('30daysAgo')

  useEffect(() => {
    loadSessionsData()
  }, [period])

  const loadSessionsData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/sessions-detail?period=${period}`)
      const result = await response.json()
      setData(result)
      
      if (response.ok) {
        toast.success('세션 분석 데이터 로드 완료')
      }
    } catch (error) {
      toast.error('세션 데이터 로드 실패')
      console.error('Sessions analysis error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeftIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
                세션 상세 분석
              </h1>
              <p className="text-gray-600 mt-1">사용자 세션의 패턴과 행동을 분석합니다</p>
            </div>
          </div>

          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7daysAgo">지난 7일</option>
            <option value="30daysAgo">지난 30일</option>
            <option value="90daysAgo">지난 90일</option>
          </select>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.totalSessions?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">평균 세션 시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.avgSessionDuration ? `${Math.round(data.avgSessionDuration / 60)}분` : '0분'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">세션당 페이지뷰</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.pagesPerSession?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">이탈률</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.bounceRate ? `${(data.bounceRate * 100).toFixed(1)}%` : '0.0%'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 시간대별 세션 분포 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시간대별 세션 분포</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-6 gap-4">
              {data?.sessionsByHour?.map((hour: any) => (
                <div key={hour.hour} className="text-center">
                  <div className="text-sm text-gray-600">{hour.hour}시</div>
                  <div className="mt-2 bg-blue-200 rounded h-16 flex items-end justify-center" style={{height: `${Math.max(20, hour.sessions / Math.max(...(data.sessionsByHour?.map((h: any) => h.sessions) || [1])) * 60)}px`}}>
                    <div className="bg-blue-600 w-full rounded" style={{height: `${Math.max(4, hour.sessions / Math.max(...(data.sessionsByHour?.map((h: any) => h.sessions) || [1])) * 56)}px`}}></div>
                  </div>
                  <div className="text-xs text-gray-800 font-medium mt-1">{hour.sessions}</div>
                </div>
              )) || Array.from({length: 24}, (_, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm text-gray-600">{i}시</div>
                  <div className="mt-2 bg-gray-200 rounded h-4"></div>
                  <div className="text-xs text-gray-800 font-medium mt-1">0</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 기기별 세션 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">기기별 세션</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data?.sessionsByDevice?.map((device: any) => (
                  <div key={device.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{backgroundColor: device.color}}></div>
                      <span className="text-sm font-medium text-gray-900">{device.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{device.sessions.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{device.percentage}%</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    데이터를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">지역별 세션</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data?.sessionsByCountry?.map((country: any, index: number) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{country.sessions.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{country.percentage}%</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    데이터를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}