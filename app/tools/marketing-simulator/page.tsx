'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { RocketLaunchIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline'

interface SimulationResult {
  scenario: string
  predictedTraffic: number
  predictedConversions: number
  predictedRevenue: number
  aiInsight: string
}

export default function MarketingSimulatorPage() {
  const [initialTraffic, setInitialTraffic] = useState(10000)
  const [conversionRate, setConversionRate] = useState(2.0)
  const [avgOrderValue, setAvgOrderValue] = useState(50000)
  const [trafficChange, setTrafficChange] = useState(10) // % change
  const [conversionChange, setConversionChange] = useState(0.5) // % point change
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runSimulation = async () => {
    setIsLoading(true)
    setSimulationResult(null)

    // Basic simulation logic
    const newTraffic = initialTraffic * (1 + trafficChange / 100)
    const newConversionRate = (conversionRate + conversionChange) / 100
    const newConversions = newTraffic * newConversionRate
    const newRevenue = newConversions * avgOrderValue

    // Prepare data for AI insight
    const simulationData = {
      initialTraffic,
      conversionRate,
      avgOrderValue,
      trafficChange,
      conversionChange,
      newTraffic: Math.round(newTraffic),
      newConversionRate: newConversionRate * 100,
      newConversions: Math.round(newConversions),
      newRevenue: Math.round(newRevenue),
    }

    try {
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'simulation',
          propertyId: 'mock-property-id', // Mock ID for simulation
          prompt: `다음은 마케팅 시뮬레이션 데이터입니다. 이 데이터를 바탕으로 예상되는 트래픽, 전환, 수익 변화에 대한 3가지 시뮬레이션 결과 인사이트와 2가지 전략적 제안을 한국어로 요약해줘.\n\n${JSON.stringify(simulationData, null, 2)}`
        })
      })

      const result = await response.json()
      if (result.success) {
        setSimulationResult({
          scenario: `트래픽 ${trafficChange}% 변화, 전환율 ${conversionChange}%p 변화 시뮬레이션`,
          predictedTraffic: Math.round(newTraffic),
          predictedConversions: Math.round(newConversions),
          predictedRevenue: Math.round(newRevenue),
          aiInsight: result.insight
        })
        toast.success('시뮬레이션 및 AI 인사이트 생성 완료!')
      } else {
        toast.error(result.error || '시뮬레이션 실패')
      }
    } catch (error) {
      console.error('Simulation error:', error)
      toast.error('시뮬레이션 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <div className="flex items-center space-x-4 mb-6">
          <RocketLaunchIcon className="h-10 w-10 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">마케팅 시뮬레이터</h1>
        </div>
        <p className="text-gray-600 mb-8">다양한 마케팅 시나리오를 시뮬레이션하고, 예상되는 성과 변화를 예측합니다.</p>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="initialTraffic" className="block text-sm font-medium text-gray-700">현재 월간 트래픽</label>
              <input
                type="number"
                id="initialTraffic"
                value={initialTraffic}
                onChange={(e) => setInitialTraffic(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="conversionRate" className="block text-sm font-medium text-gray-700">현재 전환율 (%)</label>
              <input
                type="number"
                id="conversionRate"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="avgOrderValue" className="block text-sm font-medium text-gray-700">평균 주문 가치 (원)</label>
              <input
                type="number"
                id="avgOrderValue"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="trafficChange" className="block text-sm font-medium text-gray-700">트래픽 변화율 (%)</label>
              <input
                type="number"
                id="trafficChange"
                value={trafficChange}
                onChange={(e) => setTrafficChange(Number(e.target.value))}
                step="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">예: 10 입력 시 10% 증가, -5 입력 시 5% 감소</p>
            </div>
            <div>
              <label htmlFor="conversionChange" className="block text-sm font-medium text-gray-700">전환율 변화 (퍼센트 포인트 %p)</label>
              <input
                type="number"
                id="conversionChange"
                value={conversionChange}
                onChange={(e) => setConversionChange(Number(e.target.value))}
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500">예: 0.5 입력 시 0.5%p 증가, -0.2 입력 시 0.2%p 감소</p>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <RocketLaunchIcon className="-ml-1 mr-3 h-5 w-5" />
            )}
            {isLoading ? '시뮬레이션 실행 중...' : '시뮬레이션 실행'}
          </button>
        </div>

        {simulationResult && (
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-indigo-800 mb-4">시뮬레이션 결과</h3>
            <p className="text-lg font-medium text-gray-700 mb-2">시나리오: {simulationResult.scenario}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">예상 월간 트래픽:</p>
                <p className="text-xl font-bold text-indigo-700">{simulationResult.predictedTraffic.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">예상 전환수:</p>
                <p className="text-xl font-bold text-indigo-700">{simulationResult.predictedConversions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">예상 수익:</p>
                <p className="text-xl font-bold text-indigo-700">{formatCurrency(simulationResult.predictedRevenue)}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-md shadow-sm">
              <div className="flex items-center mb-2">
                <LightBulbIcon className="h-5 w-5 text-indigo-500 mr-2" />
                <h4 className="font-semibold text-gray-800">Gemini AI 인사이트</h4>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line">{simulationResult.aiInsight}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}