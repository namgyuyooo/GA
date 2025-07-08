import { NextRequest, NextResponse } from 'next/server'
import { getGeminiApiKey } from '../../../../lib/geminiClient'
import * as fs from 'fs'
import * as path from 'path'

function loadModelPriorities() {
  try {
    const configPath = path.join(process.cwd(), 'config/ai-models-config.json')
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8')
      const config = JSON.parse(data)
      return config.modelPriorities || []
    }
  } catch (error) {
    console.error('AI 모델 우선순위 설정 로드 실패:', error)
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = getGeminiApiKey()
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (!res.ok)
      return NextResponse.json({ success: false, error: '모델 리스트 조회 실패' }, { status: 500 })
    
    const data = await res.json()
    const savedPriorities = loadModelPriorities()
    
    // generateContent 지원 모델을 모두 추출
    const allModels = (data.models || [])
      .filter((m: any) =>
        (m.supportedGenerationMethods || []).includes('generateContent')
      )
      .map((m: any) => ({
        id: m.name.replace('models/', ''),
        displayName: m.displayName || m.name.replace('models/', ''),
        description: m.description || '',
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit,
        isExp: m.name?.includes('exp') || false,
        isPro: m.name?.includes('pro') || false,
        isFlash: m.name?.includes('flash') || false,
      }))

    // 저장된 우선순위가 있으면 그것을 사용, 없으면 기본 우선순위 적용
    let models
    if (savedPriorities.length > 0) {
      // 우선순위 설정에 따라 정렬하고 활성화된 모델만 포함
      const priorityMap = new Map(savedPriorities.map((p: any) => [p.id, p]))
      
      models = allModels
        .filter((model: any) => {
          const priority = priorityMap.get(model.id)
          return priority ? priority.enabled : false
        })
        .sort((a: any, b: any) => {
          const aPriority = priorityMap.get(a.id)?.priority || 999
          const bPriority = priorityMap.get(b.id)?.priority || 999
          return aPriority - bPriority
        })
    } else {
      // 기본 우선순위: Flash → Pro → Exp → 기타 순으로 정렬
      models = allModels.sort((a: any, b: any) => {
        const getPriority = (model: any) => {
          if (model.isFlash) return 1
          if (model.isPro) return 2
          if (model.isExp) return 3
          return 4
        }
        return getPriority(a) - getPriority(b)
      })
    }

    return NextResponse.json({ success: true, models })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || '모델 리스트 조회 실패' },
      { status: 500 }
    )
  }
}
