import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const config = await prisma.setting.findUnique({
      where: { key: 'geminiConfig' },
    })

    return NextResponse.json({
      success: true,
      config: config ? JSON.parse(config.value) : null,
    })
  } catch (error: any) {
    console.error('Error fetching Gemini config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Gemini config',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { selectedGeminiModel, selectedDefaultPromptTemplateId, geminiModelPriority } =
      await request.json()

    const updatedConfig = await prisma.setting.upsert({
      where: { key: 'geminiConfig' },
      update: {
        value: JSON.stringify({
          selectedGeminiModel,
          selectedDefaultPromptTemplateId,
          geminiModelPriority,
        }),
      },
      create: {
        key: 'geminiConfig',
        value: JSON.stringify({
          selectedGeminiModel,
          selectedDefaultPromptTemplateId,
          geminiModelPriority,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      config: JSON.parse(updatedConfig.value),
    })
  } catch (error: any) {
    console.error('Error saving Gemini config:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save Gemini config',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
