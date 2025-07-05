import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Helper to generate UTM URL
const generateUrl = (data: {
  baseUrl: string
  source: string
  medium: string
  campaign: string
  term?: string
  content?: string
}) => {
  try {
    const url = new URL(data.baseUrl)
    const params = new URLSearchParams()
    params.set('utm_source', data.source)
    params.set('utm_medium', data.medium)
    params.set('utm_campaign', data.campaign)
    if (data.term) params.set('utm_term', data.term)
    if (data.content) params.set('utm_content', data.content)
    return `${url.origin}${url.pathname}${url.search ? '&' : '?'}${params.toString()}`
  } catch (error) {
    console.error('Invalid baseUrl:', data.baseUrl)
    return '' // Return empty string for invalid URLs
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of campaigns' },
        { status: 400 }
      )
    }

    let createdCount = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < body.length; i++) {
      const campaignData = body[i]
      const index = i
      const { name, baseUrl, source, medium, campaign, term, content, description } = campaignData

      if (!name || !baseUrl || !source || !medium || !campaign) {
        errors.push({
          row: index + 1,
          error: 'Missing required fields (name, baseUrl, source, medium, campaign)',
        })
        continue
      }

      const url = generateUrl(campaignData)
      if (!url) {
        errors.push({ row: index + 1, error: `Invalid baseUrl: ${baseUrl}` })
        continue
      }

      try {
        await prisma.utmCampaign.create({
          data: {
            name,
            source,
            medium,
            campaign,
            term,
            content,
            description,
            url,
          },
        })
        createdCount++
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Unique constraint violation
          errors.push({
            row: index + 1,
            error: `Campaign with source '${source}', medium '${medium}', and campaign '${campaign}' already exists.`,
          })
        } else {
          errors.push({ row: index + 1, error: `Database error: ${e.message}` })
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: `Processed with some errors. Created: ${createdCount}, Failed: ${errors.length}`,
          errors,
        },
        { status: 207 }
      ) // Multi-Status
    }

    return NextResponse.json({ message: 'Bulk import successful', createdCount }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
