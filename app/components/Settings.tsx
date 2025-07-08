'use client'

import {
  CheckCircleIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon,
  SparklesIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon, // For backup settings
  CpuChipIcon, // For AI settings
  WrenchScrewdriverIcon, // For env manager
  CommandLineIcon, // For JSON validator
  UserPlusIcon, // For user management
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import EnvManagerTab from './settings/EnvManagerTab'
import JsonValidatorTab from './settings/JsonValidatorTab'
import UserManagementTab from './settings/UserManagementTab'
import AIModelsTab from './settings/AIModelsTab'

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

interface PromptTemplate {
  id: string
  name: string
  type: string
  description?: string
  prompt: string
  variables?: string
  isActive: boolean
  isDefault: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}


export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    GTM_ACCOUNT_ID: '',
    GTM_PUBLIC_ID: '',
    GA_PROPERTY_ID: '',
    GOOGLE_SERVICE_ACCOUNT_JSON: '',
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
    aiPrompt:
      '다음 데이터를 분석하여 주요 인사이트와 개선점을 제시해주세요. 비즈니스 관점에서 실용적인 조언을 포함해주세요.',
    propertyIds: ['464147982'],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('weekly-report')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'weekly-report',
    description: '',
    prompt: '',
    variables: '',
    isActive: true,
    isDefault: false,
    sortOrder: 0,
  })

  useEffect(() => {
    fetchSettings()
    fetchWeeklySchedule()
    fetchPromptTemplates()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings((prev) => ({ ...prev, ...data }))
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

  const fetchPromptTemplates = async () => {
    try {
      const response = await fetch('/api/settings/prompt-templates')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPromptTemplates(data.templates)
        }
      }
    } catch (error) {
      console.error('프롬프트 템플릿 조회 오류:', error)
    }
  }


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setWeeklySchedule((prev) => ({ ...prev, [name]: checked }))
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleWeeklyScheduleChange = (field: keyof WeeklyReportSchedule, value: any) => {
    setWeeklySchedule((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
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
        body: JSON.stringify({ schedule: weeklySchedule }),
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
          schedule: weeklySchedule,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const modelInfo = result.report?.selectedModel
          ? ` (사용 모델: ${result.report.selectedModel})`
          : ''
        toast.success(`테스트 주간 보고서가 생성되었습니다!${modelInfo}`)
      } else {
        toast.error('테스트 보고서 생성에 실패했습니다.')
      }
    } catch (error) {
      toast.error('테스트 보고서 생성 중 오류가 발생했습니다.')
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          template: newTemplate,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPromptTemplates((prev) => [...prev, result.template])
          setShowTemplateModal(false)
          setNewTemplate({
            name: '',
            type: 'weekly-report',
            description: '',
            prompt: '',
            variables: '',
            isActive: true,
            isDefault: false,
            sortOrder: 0,
          })
          toast.success('프롬프트 템플릿이 생성되었습니다.')
        }
      }
    } catch (error) {
      toast.error('템플릿 생성 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return

    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          template: editingTemplate,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPromptTemplates((prev) =>
            prev.map((t) => (t.id === editingTemplate.id ? result.template : t))
          )
          setShowTemplateModal(false)
          setEditingTemplate(null)
          toast.success('프롬프트 템플릿이 업데이트되었습니다.')
        }
      }
    } catch (error) {
      toast.error('템플릿 업데이트 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return

    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          template: { id: templateId },
        }),
      })

      if (response.ok) {
        setPromptTemplates((prev) => prev.filter((t) => t.id !== templateId))
        toast.success('프롬프트 템플릿이 삭제되었습니다.')
      }
    } catch (error) {
      toast.error('템플릿 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleTemplateActive = async (template: PromptTemplate) => {
    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-active',
          template,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPromptTemplates((prev) =>
            prev.map((t) => (t.id === template.id ? result.template : t))
          )
          toast.success(`템플릿이 ${result.template.isActive ? '활성화' : '비활성화'}되었습니다.`)
        }
      }
    } catch (error) {
      toast.error('템플릿 상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleSetDefaultTemplate = async (template: PromptTemplate) => {
    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-default',
          template,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPromptTemplates((prev) =>
            prev.map((t) => ({
              ...t,
              isDefault:
                t.id === template.id ? true : t.type === template.type ? false : t.isDefault,
            }))
          )
          toast.success('기본 템플릿이 설정되었습니다.')
        }
      }
    } catch (error) {
      toast.error('기본 템플릿 설정 중 오류가 발생했습니다.')
    }
  }

  const handleSeedDefaults = async () => {
    try {
      const response = await fetch('/api/settings/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seed-defaults',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          fetchPromptTemplates()
          toast.success('기본 템플릿이 생성되었습니다.')
        }
      }
    } catch (error) {
      toast.error('기본 템플릿 생성 중 오류가 발생했습니다.')
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
    { 
      id: 'general', 
      name: '일반 설정', 
      icon: Cog6ToothIcon,
      description: '기본적인 시스템 설정 및 애플리케이션 구성'
    },
    { 
      id: 'user-management', 
      name: '사용자 관리', 
      icon: UserPlusIcon,
      description: '시스템 사용자 계정 생성, 수정 및 권한 관리'
    },
    { 
      id: 'schedule', 
      name: '스케줄러', 
      icon: ClockIcon,
      description: '자동화된 작업 스케줄링 및 주기적 작업 설정'
    },
    { 
      id: 'report', 
      name: '주간 보고서', 
      icon: DocumentTextIcon,
      description: '주간 보고서 생성 설정 및 자동 배포 구성'
    },
    { 
      id: 'prompts', 
      name: '프롬프트 템플릿', 
      icon: SparklesIcon,
      description: 'AI 분석용 프롬프트 템플릿 관리 및 커스터마이징'
    },
    { 
      id: 'ai', 
      name: 'AI 설정', 
      icon: CpuChipIcon,
      description: 'Gemini AI 모델 설정 및 API 구성 관리'
    },
    { 
      id: 'env-manager', 
      name: '환경변수 관리', 
      icon: WrenchScrewdriverIcon,
      description: '시스템 환경변수 설정 및 API 키 관리'
    },
    { 
      id: 'json-validator', 
      name: 'JSON 검증', 
      icon: CommandLineIcon,
      description: '설정 파일 검증 및 JSON 구조 분석 도구'
    },
    { 
      id: 'backup', 
      name: '백업', 
      icon: EnvelopeIcon,
      description: '데이터 백업 및 Google Sheets 연동 관리'
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Cog6ToothIcon className="h-6 w-6 mr-2" />
          통합 설정
        </h1>
        <p className="text-sm text-gray-600 mt-1">애플리케이션의 모든 설정을 관리할 수 있습니다.</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              title={tab.description}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* 활성 탭 설명 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h3>
            <p className="text-sm text-blue-700">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* 일반 설정 탭 */}
      {activeTab === 'general' && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">시스템 기본 설정</h2>
            <p className="text-sm text-gray-600 mt-1">
              애플리케이션의 기본적인 시스템 설정을 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">애플리케이션 정보</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">버전:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">v1.0.0</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">환경:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      process.env.NODE_ENV === 'production' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">포트:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {process.env.PORT || '3000'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-2">시스템 상태</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">데이터베이스 연결</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">환경변수 로드</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-gray-600">인증 시스템</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-md font-medium text-blue-900 mb-2">⚙️ 설정 가이드</h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>1. 환경변수 관리:</strong> API 키와 데이터베이스 설정을 구성하세요.</p>
                  <p><strong>2. 사용자 관리:</strong> 시스템 접근 권한을 가진 사용자를 추가하세요.</p>
                  <p><strong>3. AI 설정:</strong> Gemini AI 모델과 프롬프트를 설정하세요.</p>
                  <p><strong>4. 스케줄러:</strong> 자동화된 보고서 생성을 설정하세요.</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-md font-medium text-yellow-900 mb-2">⚠️ 중요 안내</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• 환경변수 변경 후에는 서버 재시작이 필요할 수 있습니다.</p>
                  <p>• API 키는 안전하게 보관하고 정기적으로 교체하세요.</p>
                  <p>• 백업 기능을 활용하여 정기적으로 데이터를 백업하세요.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-medium text-gray-900">빠른 작업</h3>
                <p className="text-sm text-gray-600">자주 사용하는 설정 작업들</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('env-manager')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <WrenchScrewdriverIcon className="h-4 w-4" />
                  환경변수 설정
                </button>
                <button
                  onClick={() => setActiveTab('user-management')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  사용자 추가
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  className="btn-primary flex items-center gap-2"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  백업 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 관리 탭 */}
      {activeTab === 'user-management' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <UserManagementTab />
        </div>
      )}

      {/* 스케줄러 탭 */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            스케줄러 설정
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">스케줄러 기능</h4>
                    <p className="text-sm text-blue-700">
                      자동화된 작업을 설정할 수 있습니다. 현재는 주간 보고서 생성 기능을 지원하며, 
                      설정된 시간에 자동으로 보고서를 생성하고 이메일로 전송할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">✅ 지원 기능</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 주간 보고서 자동 생성</li>
                <li>• 이메일 자동 발송</li>
                <li>• AI 분석 포함</li>
                <li>• 시간대별 스케줄링</li>
              </ul>
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
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              주간 보고서 설정
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              자동으로 생성되는 주간 보고서의 내용과 배포 설정을 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <div className="flex">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">AI 기반 보고서</h4>
                    <p className="text-sm text-purple-700">
                      Gemini AI가 Google Analytics 데이터를 분석하여 인사이트를 제공합니다. 
                      트래픽 변화, 성과 분석, 개선 제안 등을 자동으로 포함합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-orange-800 mb-2">📊 포함 데이터</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 주요 KPI 요약</li>
                <li>• 트래픽 변화 분석</li>
                <li>• UTM 캠페인 성과</li>
                <li>• AI 인사이트</li>
              </ul>
            </div>
          </div>

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
                AI가 데이터를 분석할 때 사용할 프롬프트입니다. 비즈니스 관점에서 실용적인 조언을
                요청하는 것이 좋습니다.
              </p>
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                <strong>🤖 AI 모델 정보:</strong> 시스템이 자동으로 사용 가능한 무료 Gemini 모델을
                선택합니다.
                <br />
                우선순위: gemini-1.5-flash-exp → gemini-1.5-flash → gemini-1.5-pro-exp →
                gemini-1.5-pro
              </div>
            </div>
          )}

          <div>
            <label className="label">수신자 이메일 (선택사항)</label>
            <input
              type="text"
              value={weeklySchedule.recipients.join(', ')}
              onChange={(e) =>
                handleWeeklyScheduleChange(
                  'recipients',
                  e.target.value
                    .split(',')
                    .map((email) => email.trim())
                    .filter(Boolean)
                )
              }
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

      {/* 프롬프트 템플릿 탭 */}
      {activeTab === 'prompts' && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              프롬프트 템플릿 관리
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSeedDefaults}
                className="btn-secondary flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                기본 템플릿 생성
              </button>
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setShowTemplateModal(true)
                }}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />새 템플릿
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">프롬프트 템플릿 관리</h4>
                  <p className="text-sm text-blue-700">
                    AI 인사이트 생성에 사용할 프롬프트를 관리할 수 있습니다. 
                    주간보고서, 월간보고서, 각 분석 탭별 인사이트용 템플릿을 설정할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">🎯 템플릿 유형</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• <strong>주간보고서:</strong> 주간 성과 분석</li>
                <li>• <strong>월간보고서:</strong> 월간 트렌드 분석</li>
                <li>• <strong>트래픽분석:</strong> 유입 경로 분석</li>
                <li>• <strong>코호트분석:</strong> 사용자 행동 분석</li>
              </ul>
            </div>
          </div>

          {/* 템플릿 타입 필터 */}
          <div>
            <label className="label">템플릿 유형 필터</label>
            <select
              value={selectedTemplateType}
              onChange={(e) => setSelectedTemplateType(e.target.value)}
              className="input-field"
            >
              <option value="">모든 유형</option>
              <option value="weekly-report">주간보고서</option>
              <option value="monthly-report">월간보고서</option>
              <option value="traffic-insight">트래픽분석</option>
              <option value="utm-cohort-insight">UTM코호트</option>
              <option value="keyword-cohort-insight">키워드코호트</option>
            </select>
          </div>

          {/* 템플릿 목록 */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">템플릿 목록</h3>
            <div className="grid gap-4">
              {promptTemplates
                .filter((t) => !selectedTemplateType || t.type === selectedTemplateType)
                .map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          {template.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              기본
                            </span>
                          )}
                          {!template.isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              비활성
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="text-xs text-gray-500">
                          유형: {template.type} | 생성일:{' '}
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTemplateActive(template)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title={template.isActive ? '비활성화' : '활성화'}
                        >
                          {template.isActive ? (
                            <EyeIcon className="h-4 w-4" />
                          ) : (
                            <EyeSlashIcon className="h-4 w-4" />
                          )}
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleSetDefaultTemplate(template)}
                            className="p-1 text-blue-400 hover:text-blue-600"
                            title="기본으로 설정"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTemplate(template)
                            setShowTemplateModal(true)
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {promptTemplates.filter((t) => !selectedTemplateType || t.type === selectedTemplateType)
              .length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {selectedTemplateType
                  ? `${selectedTemplateType} 유형의 템플릿이 없습니다.`
                  : '템플릿이 없습니다.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI 설정 탭 */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <AIModelsTab />
        </div>
      )}

      {/* 환경변수 관리 탭 */}
      {activeTab === 'env-manager' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <EnvManagerTab />
        </div>
      )}

      {/* JSON 검증 탭 */}
      {activeTab === 'json-validator' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <JsonValidatorTab />
        </div>
      )}

      {/* 백업 탭 */}
      {activeTab === 'backup' && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            데이터 백업
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">데이터 백업 기능</h4>
                  <p className="text-sm text-yellow-700">
                    현재 데이터베이스의 모든 데이터를 Google Sheets로 백업할 수 있습니다. 
                    정기적인 백업을 통해 데이터 손실을 방지할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">⚠️ 백업 주의사항</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Google Sheets API 권한 필요</li>
                <li>• 대용량 데이터는 시간 소요</li>
                <li>• 기존 백업 파일 덮어쓰기</li>
                <li>• 백업 중 다른 작업 제한</li>
              </ul>
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
