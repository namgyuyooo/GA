import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config/ai-models-config.json')

interface ModelPriority {
  id: string
  displayName: string
  priority: number
  enabled: boolean
}

function loadConfig(): { modelPriorities: ModelPriority[] } {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('AI 모델 설정 로드 실패:', error)
  }

  // 기본 설정
  return {
    modelPriorities: [
      { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', priority: 1, enabled: true },
      { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', priority: 2, enabled: true },
      { id: 'gemini-pro', displayName: 'Gemini Pro', priority: 3, enabled: true },
    ]
  }
}

function saveConfig(config: { modelPriorities: ModelPriority[] }) {
  try {
    const configDir = path.dirname(CONFIG_PATH)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('AI 모델 설정 저장 실패:', error)
    return false
  }
}

export async function GET() {
  try {
    const config = loadConfig()
    
    // 실제 Gemini API에서 사용 가능한 모델 목록 가져오기
    const { getGeminiApiKey } = require('../../../../lib/geminiClient')
    const apiKey = getGeminiApiKey()
    
    let availableModels = []
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      if (res.ok) {
        const data = await res.json()
        availableModels = (data.models || [])
          .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
          .map((m: any) => ({
            id: m.name.replace('models/', ''),
            displayName: m.displayName || m.name.replace('models/', ''),
            description: m.description || '',
            isAvailable: true
          }))
      }
    } catch (apiError) {
      console.error('Gemini API 호출 실패:', apiError)
    }

    return NextResponse.json({
      success: true,
      config: config.modelPriorities,
      availableModels
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI 모델 설정 조회 실패' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelPriorities } = body

    if (!Array.isArray(modelPriorities)) {
      return NextResponse.json(
        { success: false, error: '잘못된 모델 우선순위 데이터' },
        { status: 400 }
      )
    }

    const config = { modelPriorities }
    const saved = saveConfig(config)

    if (!saved) {
      return NextResponse.json(
        { success: false, error: '설정 저장 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'AI 모델 우선순위가 저장되었습니다.',
      config: config.modelPriorities
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI 모델 설정 저장 실패' },
      { status: 500 }
    )
  }
}