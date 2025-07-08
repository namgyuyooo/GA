import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Test API called')
    return NextResponse.json({ 
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      database_url: process.env.DATABASE_URL?.includes('localhost') ? 'local' : 'remote',
      actual_database_url: process.env.DATABASE_URL
    })
  } catch (error: any) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}