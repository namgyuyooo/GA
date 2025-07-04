import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

// 무료(exp) Gemini 모델 우선순위 리스트
const FREE_GEMINI_MODELS = [
  'gemini-1.5-flash-exp',
  'gemini-1.5-pro-exp',
  'gemini-1.0-pro',
  'gemini-pro'
]

// /secrets/.env에서 API Key 읽기
export function getGeminiApiKey() {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(process.cwd(), 'secrets', '.env'),
    path.join(process.cwd(), '..', 'GA', 'secrets', '.env'),
    path.join('/Users/rtm/Documents/GitHub/GA/secrets', '.env')
  ]
  
  let envPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      envPath = p
      break
    }
  }
  
  if (!envPath) throw new Error('.env 파일을 찾을 수 없습니다: ' + possiblePaths.join(', '))
  
  const env = fs.readFileSync(envPath, 'utf8')
  // FREE_KEY 우선, 없으면 기존 KEY 사용
  const freeKeyMatch = env.match(/GEMINI_API_FREE_KEY\s*=\s*(.+)/)
  if (freeKeyMatch) return freeKeyMatch[1].trim()
  const keyMatch = env.match(/GEMINI_API_KEY\s*=\s*(.+)/)
  if (keyMatch) return keyMatch[1].trim()
  throw new Error('GEMINI_API_FREE_KEY 또는 GEMINI_API_KEY가 .env에 없습니다')
}

export function getGeminiProjectId() {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(process.cwd(), 'secrets', '.env'),
    path.join(process.cwd(), '..', 'GA', 'secrets', '.env'),
    path.join('/Users/rtm/Documents/GitHub/GA/secrets', '.env')
  ]
  
  let envPath = ''
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      envPath = p
      break
    }
  }
  
  if (!envPath) throw new Error('.env 파일을 찾을 수 없습니다: ' + possiblePaths.join(', '))
  
  const env = fs.readFileSync(envPath, 'utf8')
  const match = env.match(/GEMINI_API_PROJECT_ID\s*=\s*(.+)/)
  if (!match) throw new Error('GEMINI_API_PROJECT_ID가 .env에 없습니다')
  return match[1].trim()
}

// 무료(exp) 모델 중 사용 가능한 최적의 모델을 반환
export async function getBestFreeGeminiModel(priorityList?: string[]) {
  const apiKey = getGeminiApiKey()
  const modelsToConsider = priorityList && priorityList.length > 0 ? priorityList : FREE_GEMINI_MODELS
  // 1. 실제 사용 가능한 모델 리스트 조회
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!res.ok) throw new Error('Gemini 모델 리스트 조회 실패')
  const data = await res.json()
  // 2. exp/free + generateContent 지원 모델만 추출
  const availableModels = (data.models || [])
    .filter((m: any) =>
      (m.supportedGenerationMethods || []).includes('generateContent')
    )
    .map((m: any) => m.name.replace('models/', ''))

  // 3. 우선순위 리스트에 따라 사용 가능한 모델 반환
  for (const model of modelsToConsider) {
    if (availableModels.includes(model)) {
      return model
    }
  }

  // fallback: 우선순위 리스트에 없지만 사용 가능한 exp 모델 반환
  const expModels = availableModels.filter((m: string) => m.includes('exp'))
  if (expModels.length > 0) return expModels[0]

  // 최종 fallback: 사용 가능한 모델 중 첫 번째 모델 반환
  if (availableModels.length > 0) return availableModels[0]

  throw new Error('사용 가능한 Gemini 모델이 없습니다. (실제 사용 가능 모델: ' +
    availableModels.join(', ') + ')')

// Gemini API로 프롬프트 전송 (무료 모델만)
export async function runGeminiPrompt(prompt: string, context?: any, modelOverride?: string) {
  const apiKey = getGeminiApiKey()
  const model = modelOverride || (await getBestFreeGeminiModel())
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  }
  if (context) {
    body.contents[0].parts.push({ text: JSON.stringify(context) })
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json()
  if (!res.ok) {
    // Google API의 에러 메시지를 함께 반환
    throw new Error('Gemini API 호출 실패: ' + (data.error?.message || JSON.stringify(data)))
  }
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text
  }
  throw new Error('Gemini 응답이 올바르지 않습니다: ' + JSON.stringify(data))
} 