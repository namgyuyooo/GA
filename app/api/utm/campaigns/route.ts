import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const campaigns = await prisma.utmCampaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('UTM campaigns fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, source, medium, campaign, term, content, description, url } = body

    // 필수 필드 검증
    if (!name || !url || !source || !medium || !campaign) {
      return NextResponse.json(
        {
          error: 'Missing required fields: name, url, source, medium, campaign',
        },
        { status: 400 }
      )
    }

    const newCampaign = await prisma.utmCampaign.create({
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

    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error: any) {
    console.error('UTM campaign creation error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Campaign with the same source, medium, and campaign name already exists',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
