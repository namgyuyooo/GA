import { NextRequest, NextResponse } from 'next/server'
import { getGeminiApiKey } from '../../../../lib/geminiClient'

export async function GET(request: NextRequest) {
  try {
    const apiKey = getGeminiApiKey()
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (!res.ok) return NextResponse.json({ success: false, error: '모델 리스트 조회 실패' }, { status: 500 })
    const data = await res.json()
    // exp/free + generateContent 지원 모델만 추출
    const models = (data.models || [])
      .filter((m: any) =>
        m.name?.includes('exp') &&
        (m.supportedGenerationMethods || []).includes('generateContent')
      )
      .map((m: any) => ({
        id: m.name.replace('models/', ''),
        displayName: m.displayName || m.name.replace('models/', ''),
        description: m.description || '',
        inputTokenLimit: m.inputTokenLimit,
        outputTokenLimit: m.outputTokenLimit
      }))
    return NextResponse.json({ success: true, models })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || '모델 리스트 조회 실패' }, { status: 500 })
  }
} 