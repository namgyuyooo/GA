'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Eye, 
  EyeOff,
  Copy,
  Save,
  RefreshCw
} from 'lucide-react'

interface ValidationError {
  path: string
  message: string
  value?: any
  expected?: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
  stats: {
    totalFields: number
    requiredFields: number
    optionalFields: number
    sensitiveFields: number
  }
}

export default function JsonValidatorPage() {
  const [jsonContent, setJsonContent] = useState('')
  const [fileType, setFileType] = useState<'env-config' | 'secret'>('secret')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [maskSensitive, setMaskSensitive] = useState(true)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateJson = useCallback(async (content: string, type: 'env-config' | 'secret') => {
    if (!content.trim()) {
      setValidationResult(null)
      return
    }

    setIsValidating(true)
    
    try {
      // Parse JSON first
      const parsed = JSON.parse(content)
      
      // Perform validation based on type
      const result = type === 'secret' 
        ? validateSecretJson(parsed)
        : validateEnvConfigJson(parsed)
      
      setValidationResult(result)
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        errors: [{
          path: 'root',
          message: `JSON 구문 오류: ${error.message}`,
          value: null
        }],
        warnings: [],
        stats: { totalFields: 0, requiredFields: 0, optionalFields: 0, sensitiveFields: 0 }
      })
    } finally {
      setIsValidating(false)
    }
  }, [])

  const validateSecretJson = (data: any): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    let totalFields = 0
    let requiredFields = 0
    let optionalFields = 0
    let sensitiveFields = 0

    // Check basic structure
    if (!data.secrets) {
      errors.push({
        path: 'secrets',
        message: 'Missing required "secrets" object',
        expected: 'object'
      })
    }

    if (!data.non_sensitive_config) {
      warnings.push('Missing "non_sensitive_config" object - some features may not work')
    }

    // Validate secrets section
    if (data.secrets) {
      // Google Service Account validation
      if (!data.secrets.google_service_account) {
        errors.push({
          path: 'secrets.google_service_account',
          message: 'Missing required Google Service Account configuration',
          expected: 'object'
        })
      } else {
        const gsa = data.secrets.google_service_account
        const requiredGsaFields = ['type', 'project_id', 'private_key', 'client_email']
        
        requiredGsaFields.forEach(field => {
          if (!gsa[field]) {
            errors.push({
              path: `secrets.google_service_account.${field}`,
              message: `Missing required field: ${field}`,
              expected: 'string'
            })
          }
          requiredFields++
          totalFields++
        })

        if (gsa.private_key && !gsa.private_key.includes('BEGIN PRIVATE KEY')) {
          errors.push({
            path: 'secrets.google_service_account.private_key',
            message: 'Private key format appears invalid',
            expected: 'PEM formatted private key'
          })
        }

        if (gsa.client_email && !gsa.client_email.includes('@')) {
          errors.push({
            path: 'secrets.google_service_account.client_email',
            message: 'Client email format appears invalid',
            expected: 'valid email address'
          })
        }

        sensitiveFields += 2 // private_key, client_id
      }

      // AI APIs validation
      if (!data.secrets.ai_apis) {
        errors.push({
          path: 'secrets.ai_apis',
          message: 'Missing required AI APIs configuration',
          expected: 'object'
        })
      } else {
        if (!data.secrets.ai_apis.GEMINI_API_KEY) {
          errors.push({
            path: 'secrets.ai_apis.GEMINI_API_KEY',
            message: 'Missing required GEMINI_API_KEY',
            expected: 'string starting with AIzaSy'
          })
        } else if (!data.secrets.ai_apis.GEMINI_API_KEY.startsWith('AIzaSy')) {
          warnings.push('GEMINI_API_KEY does not start with expected prefix "AIzaSy"')
        }
        
        requiredFields++
        totalFields++
        sensitiveFields++

        if (data.secrets.ai_apis.GEMINI_API_FREE_KEY) {
          optionalFields++
          totalFields++
          sensitiveFields++
        }
      }

      // Authentication validation
      if (!data.secrets.authentication) {
        errors.push({
          path: 'secrets.authentication',
          message: 'Missing required authentication configuration',
          expected: 'object'
        })
      } else {
        if (!data.secrets.authentication.JWT_SECRET) {
          errors.push({
            path: 'secrets.authentication.JWT_SECRET',
            message: 'Missing required JWT_SECRET',
            expected: 'string (minimum 32 characters)'
          })
        } else if (data.secrets.authentication.JWT_SECRET.length < 32) {
          errors.push({
            path: 'secrets.authentication.JWT_SECRET',
            message: 'JWT_SECRET is too short (minimum 32 characters)',
            value: `${data.secrets.authentication.JWT_SECRET.length} characters`
          })
        }

        if (!data.secrets.authentication.SUPER_USER_PASSWORD) {
          errors.push({
            path: 'secrets.authentication.SUPER_USER_PASSWORD',
            message: 'Missing required SUPER_USER_PASSWORD',
            expected: 'string (minimum 8 characters)'
          })
        } else if (data.secrets.authentication.SUPER_USER_PASSWORD.length < 8) {
          errors.push({
            path: 'secrets.authentication.SUPER_USER_PASSWORD',
            message: 'SUPER_USER_PASSWORD is too short (minimum 8 characters)',
            value: `${data.secrets.authentication.SUPER_USER_PASSWORD.length} characters`
          })
        }

        requiredFields += 2
        totalFields += 2
        sensitiveFields += 2
      }
    }

    // Validate non-sensitive config
    if (data.non_sensitive_config) {
      if (data.non_sensitive_config.google_analytics?.GA4_PROPERTY_ID) {
        const propertyId = data.non_sensitive_config.google_analytics.GA4_PROPERTY_ID
        if (!/^[0-9]+$/.test(propertyId)) {
          errors.push({
            path: 'non_sensitive_config.google_analytics.GA4_PROPERTY_ID',
            message: 'GA4_PROPERTY_ID should contain only numbers',
            value: propertyId
          })
        }
        totalFields++
        optionalFields++
      }

      if (data.non_sensitive_config.user_info?.SUPER_USER_EMAIL) {
        const email = data.non_sensitive_config.user_info.SUPER_USER_EMAIL
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push({
            path: 'non_sensitive_config.user_info.SUPER_USER_EMAIL',
            message: 'Invalid email format',
            value: email
          })
        }
        totalFields++
        optionalFields++
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: { totalFields, requiredFields, optionalFields, sensitiveFields }
    }
  }

  const validateEnvConfigJson = (data: any): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    let totalFields = 0
    let requiredFields = 0
    let optionalFields = 0
    let sensitiveFields = 0

    if (!data.categories) {
      errors.push({
        path: 'categories',
        message: 'Missing required "categories" object',
        expected: 'object'
      })
      return {
        isValid: false,
        errors,
        warnings,
        stats: { totalFields, requiredFields, optionalFields, sensitiveFields }
      }
    }

    // Count fields and validate structure
    Object.entries(data.categories).forEach(([categoryKey, category]: [string, any]) => {
      if (!category.variables) {
        errors.push({
          path: `categories.${categoryKey}.variables`,
          message: 'Missing variables object in category',
          expected: 'object'
        })
        return
      }

      Object.entries(category.variables).forEach(([varKey, variable]: [string, any]) => {
        totalFields++
        
        if (variable.required) {
          requiredFields++
          if (!variable.value) {
            errors.push({
              path: `categories.${categoryKey}.variables.${varKey}.value`,
              message: 'Required field is empty',
              expected: 'non-empty value'
            })
          }
        } else {
          optionalFields++
        }

        if (variable.sensitive) {
          sensitiveFields++
        }

        // Type-specific validation
        if (variable.type === 'email' && variable.value) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(variable.value)) {
            errors.push({
              path: `categories.${categoryKey}.variables.${varKey}.value`,
              message: 'Invalid email format',
              value: variable.value
            })
          }
        }

        if (variable.type === 'json' && variable.value) {
          try {
            JSON.parse(variable.value)
          } catch {
            errors.push({
              path: `categories.${categoryKey}.variables.${varKey}.value`,
              message: 'Invalid JSON format',
              value: 'Invalid JSON'
            })
          }
        }

        if (variable.minLength && variable.value && variable.value.length < variable.minLength) {
          errors.push({
            path: `categories.${categoryKey}.variables.${varKey}.value`,
            message: `Value too short (minimum ${variable.minLength} characters)`,
            value: `${variable.value.length} characters`
          })
        }
      })
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: { totalFields, requiredFields, optionalFields, sensitiveFields }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setJsonContent(content)
      validateJson(content, fileType)
    }
    reader.readAsText(file)
  }

  const handleJsonChange = (content: string) => {
    setJsonContent(content)
    validateJson(content, fileType)
  }

  const handleTypeChange = (type: 'env-config' | 'secret') => {
    setFileType(type)
    if (jsonContent) {
      validateJson(jsonContent, type)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonContent)
  }

  const downloadJson = () => {
    if (!jsonContent) return
    
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileType}-validated.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyConfiguration = async () => {
    if (!jsonContent || !validationResult?.isValid) return

    try {
      const endpoint = fileType === 'secret' ? '/api/secret-config' : '/api/env-config'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonContent
      })

      if (response.ok) {
        alert('설정이 성공적으로 적용되었습니다!')
      } else {
        const error = await response.json()
        alert(`설정 적용 실패: ${error.message}`)
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonContent)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonContent(formatted)
    } catch (error) {
      // JSON이 유효하지 않으면 무시
    }
  }

  const maskJsonContent = (content: string): string => {
    if (!maskSensitive || !content) return content
    
    try {
      const parsed = JSON.parse(content)
      const masked = JSON.parse(JSON.stringify(parsed))
      
      // Mask sensitive fields
      if (masked.secrets) {
        if (masked.secrets.google_service_account?.private_key) {
          masked.secrets.google_service_account.private_key = '-----BEGIN PRIVATE KEY-----\n[MASKED]\n-----END PRIVATE KEY-----'
        }
        if (masked.secrets.ai_apis?.GEMINI_API_KEY) {
          masked.secrets.ai_apis.GEMINI_API_KEY = 'AIzaSy••••••••••••••••••••••••••••••'
        }
        if (masked.secrets.authentication?.JWT_SECRET) {
          masked.secrets.authentication.JWT_SECRET = '••••••••••••••••••••••••••••••••'
        }
        if (masked.secrets.authentication?.SUPER_USER_PASSWORD) {
          masked.secrets.authentication.SUPER_USER_PASSWORD = '••••••••'
        }
      }
      
      return JSON.stringify(masked, null, 2)
    } catch {
      return content
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">JSON 검증 도구</h1>
              <p className="text-gray-600">환경설정 JSON 파일을 업로드하여 검증하고 적용하세요</p>
            </div>
            <div className="flex space-x-3">
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleTypeChange('secret')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    fileType === 'secret'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Secret JSON
                </button>
                <button
                  onClick={() => handleTypeChange('env-config')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    fileType === 'env-config'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Env Config
                </button>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* JSON Editor */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <h2 className="text-lg font-semibold">JSON 편집기</h2>
                  {uploadedFileName && (
                    <span className="text-sm text-gray-500">({uploadedFileName})</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {jsonContent && (
                    <>
                      <button
                        onClick={() => setMaskSensitive(!maskSensitive)}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title={maskSensitive ? "민감한 정보 표시" : "민감한 정보 숨김"}
                      >
                        {maskSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={formatJson}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="JSON 포맷팅"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-2 text-gray-500 hover:text-gray-700"
                        title="클립보드에 복사"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={showPreview ? maskJsonContent(jsonContent) : jsonContent}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full h-96 font-mono text-sm border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`${fileType === 'secret' ? 'Secret' : 'Env Config'} JSON을 여기에 붙여넣거나 파일을 업로드하세요...`}
                readOnly={showPreview}
              />
              {jsonContent && (
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showPreview ? '편집 모드' : '미리보기 모드'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={downloadJson}
                      className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      다운로드
                    </button>
                    {validationResult?.isValid && (
                      <button
                        onClick={applyConfiguration}
                        className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        적용
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Results */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                {isValidating ? (
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                ) : validationResult?.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : validationResult ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <h2 className="text-lg font-semibold">검증 결과</h2>
              </div>
            </div>
            <div className="p-4">
              {!jsonContent ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>JSON 파일을 업로드하거나 내용을 입력하세요</p>
                </div>
              ) : isValidating ? (
                <div className="text-center text-gray-500 py-8">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>검증 중...</p>
                </div>
              ) : validationResult ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className={`p-3 rounded-lg ${
                    validationResult.isValid 
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className={`font-medium ${
                        validationResult.isValid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validationResult.isValid ? '검증 성공' : '검증 실패'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm text-blue-600">총 필드</div>
                      <div className="text-lg font-semibold text-blue-800">
                        {validationResult.stats.totalFields}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm text-green-600">필수 필드</div>
                      <div className="text-lg font-semibold text-green-800">
                        {validationResult.stats.requiredFields}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-sm text-yellow-600">선택 필드</div>
                      <div className="text-lg font-semibold text-yellow-800">
                        {validationResult.stats.optionalFields}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-sm text-red-600">민감한 필드</div>
                      <div className="text-lg font-semibold text-red-800">
                        {validationResult.stats.sensitiveFields}
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        오류 ({validationResult.errors.length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {validationResult.errors.map((error, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                            <div className="font-mono text-xs text-red-600 mb-1">
                              {error.path}
                            </div>
                            <div className="text-sm text-red-800">{error.message}</div>
                            {error.expected && (
                              <div className="text-xs text-red-600 mt-1">
                                예상: {error.expected}
                              </div>
                            )}
                            {error.value && (
                              <div className="text-xs text-red-600 mt-1">
                                현재: {error.value}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        경고 ({validationResult.warnings.length})
                      </h3>
                      <div className="space-y-2">
                        {validationResult.warnings.map((warning, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <div className="text-sm text-yellow-800">{warning}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  )
}