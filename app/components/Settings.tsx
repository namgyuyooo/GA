'use client'

import { CheckCircleIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface SettingsData {
    [key: string]: string
}

export default function Settings() {
    const [settings, setSettings] = useState<SettingsData>({
        GTM_ACCOUNT_ID: '',
        GTM_PUBLIC_ID: '',
        GA_PROPERTY_ID: '',
        GOOGLE_SERVICE_ACCOUNT_JSON: ''
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isBackingUp, setIsBackingUp] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setIsLoading(true)
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setSettings(prev => ({ ...prev, [name]: value }))
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Cog6ToothIcon className="h-6 w-6 mr-2" />
                    환경 설정
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    이곳에서 애플리케이션의 주요 환경 변수를 설정할 수 있습니다.
                </p>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-lg shadow">
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

                <div className="hidden">
                    <label className="label">GTM 컨테이너 ID (이제 사용되지 않음)</label>
                    <input
                        type="text"
                        name="GTM_CONTAINER_ID"
                        value={settings.GTM_CONTAINER_ID}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="예: GTM-N99ZMP6T"
                        disabled
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
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                        <p className="text-sm text-blue-800">
                            <strong>저장 후 적용:</strong> 변경사항은 저장 후 애플리케이션에 즉시 반영되지 않을 수 있습니다. 필요한 경우 서버를 재시작해주세요.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
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
                <button
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 bg-green-600 hover:bg-green-700"
                >
                    {isBackingUp ? '백업 중...' : 'Google Sheets로 백업하기'}
                </button>
            </div>
        </div>
    )
} 