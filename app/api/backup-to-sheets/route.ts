import { PrismaClient } from '@prisma/client'
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()
const SPREADSHEET_ID = '17k0Cl7qJbkowaLmtNRpjvdmqJ7His0127aalnzhIucg'

const TABLES = [
  {
    name: 'UtmCampaigns',
    columns: [
      'id',
      'name',
      'source',
      'medium',
      'campaign',
      'term',
      'content',
      'url',
      'description',
      'status',
      'createdAt',
      'updatedAt',
    ],
    model: 'utmCampaign',
  },
  {
    name: 'WeeklyReport',
    columns: [
      'id',
      'title',
      'startDate',
      'endDate',
      'totalSessions',
      'totalUsers',
      'totalConversions',
      'avgEngagementRate',
      'totalClicks',
      'totalImpressions',
      'avgCtr',
      'avgPosition',
      'reportData',
      'createdAt',
      'updatedAt',
    ],
    model: 'weeklyReport',
  },
  {
    name: 'ScheduledJob',
    columns: [
      'id',
      'name',
      'type',
      'schedule',
      'isActive',
      'lastRun',
      'nextRun',
      'config',
      'createdAt',
      'updatedAt',
    ],
    model: 'scheduledJob',
  },
  {
    name: 'Setting',
    columns: ['key', 'value'],
    model: 'setting',
  },
]

function getSheetsClient() {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')
  const jwt = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth: jwt })
}

async function backupToSheets() {
  const sheets = getSheetsClient()

  for (const table of TABLES) {
    // @ts-ignore
    const rows = await prisma[table.model].findMany()
    const dataRows = rows.map((row: any) => table.columns.map((col) => row[col] ?? ''))
    // 1. 시트가 없으면 생성
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: table.name } } }],
        },
      })
    } catch (e) {}
    // 2. 기존 데이터 초기화
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!A:Z`,
    })
    // 3. 데이터 업로드
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [table.columns, ...dataRows],
      },
    })
  }
}

async function restoreFromSheets() {
  const sheets = getSheetsClient()

  for (const table of TABLES) {
    // 1. 시트에서 데이터 읽기
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${table.name}!A:Z`,
    })
    const values = res.data.values || []
    if (values.length < 2) continue // no data
    const [header, ...rows] = values
    // 2. 기존 데이터 삭제
    // @ts-ignore
    await prisma[table.model].deleteMany({})
    // 3. 데이터 삽입
    for (const row of rows) {
      const obj: any = {}
      table.columns.forEach((col, i) => {
        obj[col] = row[i] ?? null
      })
      // @ts-ignore
      await prisma[table.model].create({ data: obj })
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await backupToSheets()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}

export async function GET(req: NextRequest) {
  try {
    await restoreFromSheets()
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message })
  }
}
