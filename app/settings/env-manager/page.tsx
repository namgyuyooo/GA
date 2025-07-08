'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Download, Save, Eye, EyeOff, AlertCircle, CheckCircle, X } from 'lucide-react'

interface EnvVariable {
  value: string
  description: string
  required: boolean
  type: string
  sensitive?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  validation?: string
  options?: string[]
  examples?: string[]
  default?: string | number | boolean
}

interface EnvCategory {
  title: string
  description: string
  variables: Record<string, EnvVariable>
}

interface EnvConfig {
  name: string
  version: string
  description: string
  categories: Record<string, EnvCategory>
  validation: {
    required_categories: string[]
    total_variables: number
  }
  metadata?: {
    created_at: string
    updated_at: string
    version: string
  }
}

export default function EnvManagerPage() {
  const [config, setConfig] = useState<EnvConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [uploadMode, setUploadMode] = useState<'env-config' | 'secret'>('env-config')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const secretFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    try {
      const response = await fetch('/api/env-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        console.error('Failed to load config')
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSecretFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const secretConfig = JSON.parse(content)
        
        // Validate the uploaded secret config
        if (validateSecretConfig(secretConfig)) {
          // Apply the secret configuration
          const response = await fetch('/api/secret-config', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(secretConfig)
          })
          
          if (response.ok) {
            setSuccessMessage('Secret 설정이 성공적으로 업로드되고 적용되었습니다.')
            setTimeout(() => setSuccessMessage(''), 5000)
            // Reload the current config to reflect changes
            loadCurrentConfig()
          } else {
            const error = await response.json()
            setErrors({ upload: error.message || 'Failed to apply secret configuration' })
          }
        }
      } catch (error) {
        setErrors({ upload: 'Invalid secret JSON file format' })
      }
    }
    reader.readAsText(file)
  }

  const validateSecretConfig = (config: any): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!config.secrets) {
      newErrors.structure = 'Missing secrets object'
      setErrors(newErrors)
      return false
    }

    // Check required secret sections
    const requiredSections = ['google_service_account', 'ai_apis', 'authentication']
    for (const section of requiredSections) {
      if (!config.secrets[section]) {
        newErrors[section] = `Missing required secret section: ${section}`
      }
    }

    // Validate Google Service Account
    if (config.secrets.google_service_account) {
      const gsa = config.secrets.google_service_account
      if (!gsa.private_key || !gsa.client_email || !gsa.project_id) {
        newErrors.google_service_account = 'Missing required Google Service Account fields'
      }
    }

    // Validate AI APIs
    if (config.secrets.ai_apis) {
      if (!config.secrets.ai_apis.GEMINI_API_KEY) {
        newErrors.ai_apis = 'Missing required GEMINI_API_KEY'
      }
    }

    // Validate Authentication
    if (config.secrets.authentication) {
      if (!config.secrets.authentication.JWT_SECRET || !config.secrets.authentication.SUPER_USER_PASSWORD) {
        newErrors.authentication = 'Missing required authentication fields'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const uploadedConfig = JSON.parse(content)
        
        // Validate the uploaded config
        if (validateConfig(uploadedConfig)) {
          setConfig(uploadedConfig)
          setIsDirty(true)
          setSuccessMessage('설정 파일이 성공적으로 업로드되었습니다.')
          setTimeout(() => setSuccessMessage(''), 3000)
        }
      } catch (error) {
        setErrors({ upload: 'Invalid JSON file format' })
      }
    }
    reader.readAsText(file)
  }

  const validateConfig = (config: EnvConfig): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Check required categories
    if (!config.categories) {
      newErrors.structure = 'Missing categories object'
      setErrors(newErrors)
      return false
    }

    // Validate each category
    Object.entries(config.categories).forEach(([categoryKey, category]) => {
      if (!category.variables) {
        newErrors[categoryKey] = 'Missing variables in category'
        return
      }

      // Validate each variable
      Object.entries(category.variables).forEach(([varKey, variable]) => {
        const fullKey = `${categoryKey}.${varKey}`
        
        if (variable.required && !variable.value) {
          newErrors[fullKey] = 'Required field is empty'
        }
        
        if (variable.type === 'email' && variable.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(variable.value)) {
            newErrors[fullKey] = 'Invalid email format'
          }
        }
        
        if (variable.type === 'json' && variable.value) {
          try {
            JSON.parse(variable.value)
          } catch {
            newErrors[fullKey] = 'Invalid JSON format'
          }
        }
        
        if (variable.minLength && variable.value.length < variable.minLength) {
          newErrors[fullKey] = `Minimum length is ${variable.minLength}`
        }
        
        if (variable.validation && variable.value) {
          const regex = new RegExp(variable.validation)
          if (!regex.test(variable.value)) {
            newErrors[fullKey] = 'Value does not match validation pattern'
          }
        }
        
        if (variable.options && variable.value && !variable.options.includes(variable.value)) {
          newErrors[fullKey] = `Value must be one of: ${variable.options.join(', ')}`
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleVariableChange = (categoryKey: string, varKey: string, value: string) => {
    if (!config) return
    
    const newConfig = { ...config }
    newConfig.categories[categoryKey].variables[varKey].value = value
    setConfig(newConfig)
    setIsDirty(true)
    
    // Clear error for this field
    const fullKey = `${categoryKey}.${varKey}`
    if (errors[fullKey]) {
      const newErrors = { ...errors }
      delete newErrors[fullKey]
      setErrors(newErrors)
    }
  }

  const toggleSensitive = (fullKey: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [fullKey]: !prev[fullKey]
    }))
  }

  const handleSave = async () => {
    if (!config) return
    
    if (!validateConfig(config)) {
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch('/api/env-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setSuccessMessage('환경변수 설정이 성공적으로 저장되었습니다.')
        setIsDirty(false)
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        const error = await response.json()
        setErrors({ save: error.message || 'Failed to save configuration' })
      }
    } catch (error) {
      setErrors({ save: 'Network error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    if (!config) return
    
    const dataStr = JSON.stringify(config, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `env-config-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">환경변수 설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">환경변수 설정을 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">환경변수 관리</h1>
              <p className="text-gray-600">{config.description}</p>
              <p className="text-sm text-gray-500 mt-1">버전: {config.version}</p>
            </div>
            <div className="flex space-x-3">
              {/* Upload Mode Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setUploadMode('env-config')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    uploadMode === 'env-config'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Env Config
                </button>
                <button
                  onClick={() => setUploadMode('secret')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    uploadMode === 'secret'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Secret JSON
                </button>
              </div>
              
              <button
                onClick={() => {
                  if (uploadMode === 'secret') {
                    secretFileInputRef.current?.click()
                  } else {
                    fileInputRef.current?.click()
                  }
                }}
                className={`flex items-center px-4 py-2 text-white rounded-md transition-colors ${
                  uploadMode === 'secret'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMode === 'secret' ? 'Secret 업로드' : '설정 업로드'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                다운로드
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  saving || !isDirty
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Global Errors */}
        {Object.entries(errors).some(([key]) => ['upload', 'save', 'structure'].includes(key)) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800 font-medium">오류가 발생했습니다:</span>
            </div>
            <ul className="text-red-700 text-sm space-y-1">
              {Object.entries(errors)
                .filter(([key]) => ['upload', 'save', 'structure'].includes(key))
                .map(([key, error]) => (
                  <li key={key}>• {error}</li>
                ))}
            </ul>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-6">
          {Object.entries(config.categories).map(([categoryKey, category]) => (
            <div key={categoryKey} className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(category.variables).map(([varKey, variable]) => {
                    const fullKey = `${categoryKey}.${varKey}`
                    const hasError = errors[fullKey]
                    const isSensitive = variable.sensitive
                    const isHidden = isSensitive && !showSensitive[fullKey]
                    
                    return (
                      <div key={varKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            {varKey}
                            {variable.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {isSensitive && (
                            <button
                              onClick={() => toggleSensitive(fullKey)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        
                        {variable.type === 'json' ? (
                          <textarea
                            value={isHidden ? '••••••••••••••••' : variable.value}
                            onChange={(e) => handleVariableChange(categoryKey, varKey, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                              hasError ? 'border-red-300' : 'border-gray-300'
                            }`}
                            rows={4}
                            placeholder={variable.description}
                            disabled={isHidden}
                          />
                        ) : variable.options ? (
                          <select
                            value={variable.value}
                            onChange={(e) => handleVariableChange(categoryKey, varKey, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              hasError ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            {variable.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={isHidden ? 'password' : variable.type === 'email' ? 'email' : 'text'}
                            value={isHidden ? '••••••••••••••••' : variable.value}
                            onChange={(e) => handleVariableChange(categoryKey, varKey, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              hasError ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder={variable.description}
                            disabled={isHidden}
                          />
                        )}
                        
                        <div className="flex items-start justify-between">
                          <p className="text-xs text-gray-500">{variable.description}</p>
                          {hasError && (
                            <span className="text-xs text-red-500 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {hasError}
                            </span>
                          )}
                        </div>
                        
                        {variable.examples && variable.examples.length > 0 && (
                          <div className="text-xs text-gray-400">
                            예시: {variable.examples.join(', ')}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
        <input
          type="file"
          ref={secretFileInputRef}
          onChange={handleSecretFileUpload}
          accept=".json"
          className="hidden"
        />
        
        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">💡 사용 방법</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Env Config 업로드:</strong> 일반적인 환경변수 설정 파일 (.json)</li>
            <li><strong>Secret JSON 업로드:</strong> 민감한 정보가 포함된 통합 시크릿 파일</li>
            <li><strong>Secret JSON 구조:</strong> secrets (민감정보) + non_sensitive_config (일반설정)</li>
            <li><strong>보안:</strong> Secret 업로드 시 자동으로 .env 파일이 생성되어 적용됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}