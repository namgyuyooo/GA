'use client'

import { 
  CheckCircleIcon, 
  Cog6ToothIcon, 
  InformationCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CalendarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface SettingsData {
    [key: string]: string
}

interface WeeklyReportSchedule {
    id?: string
    name: string
    isActive: boolean
    dayOfWeek: number
    hour: number
    minute: number
    timezone: string
    recipients: string[]
    includeSummary: boolean
    includeIssues: boolean
    includeAI: boolean
    aiPrompt: string
    propertyIds: string[]
}

export default function Settings() {
    const [settings, setSettings] = useState<SettingsData>({
        GTM_ACCOUNT_ID: '',
        GTM_PUBLIC_ID: '',
        GA_PROPERTY_ID: '',
        GOOGLE_SERVICE_ACCOUNT_JSON: ''
    })
    const [weeklySchedule, setWeeklySchedule] = useState<WeeklyReportSchedule>({
        name: '주간 보고서',
        isActive: true,
        dayOfWeek: 1, // 월요일
        hour: 10,
        minute: 30,
        timezone: 'Asia/Seoul',
        recipients: [],
        includeSummary: true,
        includeIssues: true,
        includeAI: true,
        aiPrompt: '다음 데이터를 분석하여 주요 인사이트와 개선점을 제시해주세요. 비즈니스 관점에서 실용적인 조언을 포함해주세요.',
        propertyIds: ['464147982']
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isBackingUp, setIsBackingUp] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    useEffect(() => {
        fetchSettings()
        fetchWeeklySchedule()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(prev => ({ ...prev, ...data }))
            } else {
                toast.error('설정을 불러오는데 실패했습니다.')
            }
        } catch (error) {
            toast.error('설정 로딩 중 오류가 발생했습니다.')
        } finally {
            setIsLoading(false)
        }
    }

    const fetchWeeklySchedule = async () => {
        try {
            const response = await fetch('/api/settings/weekly-schedule')
            if (response.ok) {
                const data = await response.json()
                if (data.schedule) {
                    setWeeklySchedule(data.schedule)
                }
            }
        } catch (error) {
            console.error('Weekly schedule fetch error:', error)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setWeeklySchedule(prev => ({ ...prev, [name]: checked }))
        } else {
            setSettings(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleWeeklyScheduleChange = (field: keyof WeeklyReportSchedule, value: any) => {
        setWeeklySchedule(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })

            if (response.ok) {
                toast.success('설정이 성공적으로 저장되었습니다!')
            } else {
                toast.error('설정 저장에 실패했습니다.')
            }
        } catch (error) {
            toast.error('설정 저장 중 오류가 발생했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveWeeklySchedule = async () => {
        setIsSaving(true)
        try {
            const response = await fetch('/api/settings/weekly-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule: weeklySchedule })
            })

            if (response.ok) {
                toast.success('주간 보고서 스케줄이 저장되었습니다!')
            } else {
                toast.error('스케줄 저장에 실패했습니다.')
            }
        } catch (error) {
            toast.error('스케줄 저장 중 오류가 발생했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleBackup = async () => {
        setIsBackingUp(true)
        try {
            const response = await fetch('/api/backup-to-sheets', { method: 'POST' })
            if (response.ok) {
                toast.success('Google Sheets로 백업이 완료되었습니다!')
            } else {
                toast.error('백업에 실패했습니다.')
            }
        } catch (error) {
            toast.error('백업 중 오류가 발생했습니다.')
        } finally {
            setIsBackingUp(false)
        }
    }

    const handleTestWeeklyReport = async () => {
        try {
            const response = await fetch('/api/weekly-report/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    test: true,
                    schedule: weeklySchedule 
                })
            })
            
            if (response.ok) {
                const result = await response.json()
                const modelInfo = result.report?.selectedModel ? ` (사용 모델: ${result.report.selectedModel})` : ''
                toast.success(`테스트 주간 보고서가 생성되었습니다!${modelInfo}`)
            } else {
                toast.error('테스트 보고서 생성에 실패했습니다.')
            }
        } catch (error) {
            toast.error('테스트 보고서 생성 중 오류가 발생했습니다.')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const tabs = [
        { id: 'general', name: '일반 설정', icon: Cog6ToothIcon },
        { id: 'schedule', name: '스케줄러', icon: ClockIcon },
        { id: 'report', name: '주간 보고서', icon: DocumentTextIcon },
        { id: 'backup', name: '백업', icon: EnvelopeIcon }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Cog6ToothIcon className="h-6 w-6 mr-2" />
                    통합 설정
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    애플리케이션의 모든 설정을 관리할 수 있습니다.
                </p>
            </div>

            {/* 탭 네비게이션 */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-4 w-4 mr-2" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* 일반 설정 탭 */}
            {activeTab === 'general' && (
                <div className="space-y-6 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">환경 설정</h2>
                    
                    <div>
                        <label className="label">GTM 계정 ID</label>
                        <input
                            type="text"
                            name="GTM_ACCOUNT_ID"
                            value={settings.GTM_ACCOUNT_ID}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="예: 6243694530"
                        />
                    </div>

                    <div>
                        <label className="label">GTM Public ID</label>
                        <input
                            type="text"
                            name="GTM_PUBLIC_ID"
                            value={settings.GTM_PUBLIC_ID || ''}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="예: GTM-N99ZMP6T"
                        />
                        <p className="text-xs text-gray-500 mt-1">GTM-으로 시작하는 컨테이너 ID를 입력해주세요.</p>
                    </div>

                    <div>
                        <label className="label">GA4 속성 ID</label>
                        <input
                            type="text"
                            name="GA_PROPERTY_ID"
                            value={settings.GA_PROPERTY_ID}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="예: 464147982"
                        />
                    </div>

                    <div>
                        <label className="label">Google Service Account (JSON)</label>
                        <textarea
                            name="GOOGLE_SERVICE_ACCOUNT_JSON"
                            value={settings.GOOGLE_SERVICE_ACCOUNT_JSON}
                            onChange={handleInputChange}
                            className="input-field min-h-[150px] font-mono text-xs"
                            placeholder="Google Cloud에서 발급받은 서비스 계정 JSON 파일의 내용을 붙여넣으세요."
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                '저장 중...'
                            ) : (
                                <>
                                    <CheckCircleIcon className="h-5 w-5" />
                                    설정 저장
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* 스케줄러 탭 */}
            {activeTab === 'schedule' && (
                <div className="space-y-6 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        스케줄러 설정
                    </h2>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                            <div className="ml-3">
                                <p className="text-sm text-blue-800">
                                    <strong>스케줄러 기능:</strong> 자동화된 작업을 설정할 수 있습니다. 
                                    현재는 주간 보고서 생성 기능만 지원됩니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">스케줄 활성화</label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={weeklySchedule.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">주간 보고서 자동 생성</span>
                            </div>
                        </div>

                        <div>
                            <label className="label">요일</label>
                            <select
                                value={weeklySchedule.dayOfWeek}
                                onChange={(e) => handleWeeklyScheduleChange('dayOfWeek', parseInt(e.target.value))}
                                className="input-field"
                            >
                                <option value={0}>일요일</option>
                                <option value={1}>월요일</option>
                                <option value={2}>화요일</option>
                                <option value={3}>수요일</option>
                                <option value={4}>목요일</option>
                                <option value={5}>금요일</option>
                                <option value={6}>토요일</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">시간</label>
                            <input
                                type="time"
                                value={`${weeklySchedule.hour.toString().padStart(2, '0')}:${weeklySchedule.minute.toString().padStart(2, '0')}`}
                                onChange={(e) => {
                                    const [hour, minute] = e.target.value.split(':')
                                    handleWeeklyScheduleChange('hour', parseInt(hour))
                                    handleWeeklyScheduleChange('minute', parseInt(minute))
                                }}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="label">시간대</label>
                            <select
                                value={weeklySchedule.timezone}
                                onChange={(e) => handleWeeklyScheduleChange('timezone', e.target.value)}
                                className="input-field"
                            >
                                <option value="Asia/Seoul">한국 시간 (UTC+9)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">미국 동부 시간</option>
                                <option value="Europe/London">영국 시간</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleTestWeeklyReport}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <DocumentTextIcon className="h-4 w-4" />
                            테스트 실행
                        </button>
                        <button
                            onClick={handleSaveWeeklySchedule}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '스케줄 저장'}
                        </button>
                    </div>
                </div>
            )}

            {/* 주간 보고서 탭 */}
            {activeTab === 'report' && (
                <div className="space-y-6 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        주간 보고서 설정
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label">보고서 이름</label>
                            <input
                                type="text"
                                value={weeklySchedule.name}
                                onChange={(e) => handleWeeklyScheduleChange('name', e.target.value)}
                                className="input-field"
                                placeholder="주간 보고서"
                            />
                        </div>

                        <div>
                            <label className="label">분석할 속성</label>
                            <select
                                value={weeklySchedule.propertyIds[0] || ''}
                                onChange={(e) => handleWeeklyScheduleChange('propertyIds', [e.target.value])}
                                className="input-field"
                            >
                                <option value="464147982">Property 1 (464147982)</option>
                                <option value="482625214">Property 2 (482625214)</option>
                                <option value="483589217">Property 3 (483589217)</option>
                                <option value="462871516">Original Property (462871516)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">포함할 내용</h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includeSummary"
                                    checked={weeklySchedule.includeSummary}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">주요 요약 내용</span>
                            </div>
                            
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includeIssues"
                                    checked={weeklySchedule.includeIssues}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">주요 변동 이슈</span>
                            </div>
                            
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="includeAI"
                                    checked={weeklySchedule.includeAI}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 flex items-center">
                                    <SparklesIcon className="h-4 w-4 mr-1" />
                                    Gemini AI 자동 분석
                                </span>
                            </div>
                        </div>
                    </div>

                    {weeklySchedule.includeAI && (
                        <div>
                            <label className="label">AI 분석 프롬프트</label>
                            <textarea
                                value={weeklySchedule.aiPrompt}
                                onChange={(e) => handleWeeklyScheduleChange('aiPrompt', e.target.value)}
                                className="input-field min-h-[100px]"
                                placeholder="Gemini AI에게 전달할 분석 지시사항을 입력하세요..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                AI가 데이터를 분석할 때 사용할 프롬프트입니다. 비즈니스 관점에서 실용적인 조언을 요청하는 것이 좋습니다.
                            </p>
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                <strong>🤖 AI 모델 정보:</strong> 시스템이 자동으로 사용 가능한 무료 Gemini 모델을 선택합니다.
                                <br />
                                우선순위: gemini-1.5-flash-exp → gemini-1.5-flash → gemini-1.5-pro-exp → gemini-1.5-pro
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">수신자 이메일 (선택사항)</label>
                        <input
                            type="text"
                            value={weeklySchedule.recipients.join(', ')}
                            onChange={(e) => handleWeeklyScheduleChange('recipients', e.target.value.split(',').map(email => email.trim()).filter(Boolean))}
                            className="input-field"
                            placeholder="example@company.com, another@company.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            쉼표로 구분하여 여러 이메일을 입력할 수 있습니다. 비워두면 보고서만 생성됩니다.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveWeeklySchedule}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? '저장 중...' : '보고서 설정 저장'}
                        </button>
                    </div>
                </div>
            )}

            {/* 백업 탭 */}
            {activeTab === 'backup' && (
                <div className="space-y-6 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        데이터 백업
                    </h2>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                            <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>백업 기능:</strong> 현재 데이터베이스의 모든 데이터를 Google Sheets로 백업할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-md font-medium text-gray-900 mb-2">백업할 데이터</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• UTM 캠페인 데이터</li>
                                <li>• 키워드 코호트 그룹</li>
                                <li>• 전환 목표 설정</li>
                                <li>• GTM 목표 설정</li>
                                <li>• 주간 보고서 스케줄</li>
                                <li>• 시스템 설정</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-md font-medium text-gray-900 mb-2">주의사항</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Google Sheets API 권한이 필요합니다</li>
                                <li>• 대용량 데이터의 경우 시간이 오래 걸릴 수 있습니다</li>
                                <li>• 기존 백업 파일이 있다면 덮어쓰기됩니다</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className="btn-primary flex items-center gap-2 disabled:opacity-50 bg-green-600 hover:bg-green-700"
                        >
                            {isBackingUp ? '백업 중...' : 'Google Sheets로 백업하기'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .label {
                    @apply block text-sm font-medium text-gray-700 mb-2;
                }
                .input-field {
                    @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm;
                }
                .btn-primary {
                    @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
                }
                .btn-secondary {
                    @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
                }
            `}</style>
        </div>
    )
} 