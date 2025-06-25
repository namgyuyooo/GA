import { PrismaClient } from '@prisma/client'
import { google } from 'googleapis'
import { googleSheetsService } from '../lib/googleSheets'

const prisma = new PrismaClient()
const SPREADSHEET_ID = '17k0Cl7qJbkowaLmtNRpjvdmqJ7His0127aalnzhIucg'

async function backupTableToSheet(sheetName: string, columns: string[], rows: any[][]) {
    const accessToken = await googleSheetsService.getAccessToken()
    const sheets = google.sheets({ version: 'v4', auth: accessToken })

    // 1. 시트가 없으면 생성
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    { addSheet: { properties: { title: sheetName } } }
                ]
            }
        })
    } catch (e) {
        // 이미 있으면 무시
    }

    // 2. 기존 데이터 초기화
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:Z`
    })

    // 3. 데이터 업로드 (컬럼명 + 데이터)
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [columns, ...rows]
        }
    })
}

async function main() {
    // 1. UtmCampaign 백업
    const campaigns = await prisma.utmCampaign.findMany()
    const campaignColumns = ['id', 'name', 'source', 'medium', 'campaign', 'term', 'content', 'url', 'description', 'status', 'createdAt', 'updatedAt']
    const campaignRows = campaigns.map(c => campaignColumns.map(col => (c as any)[col] ?? ''))
    await backupTableToSheet('UtmCampaigns', campaignColumns, campaignRows)

    // 2. WeeklyReport 백업
    const reports = await prisma.weeklyReport.findMany()
    const reportColumns = ['id', 'title', 'startDate', 'endDate', 'totalSessions', 'totalUsers', 'totalConversions', 'avgEngagementRate', 'totalClicks', 'totalImpressions', 'avgCtr', 'avgPosition', 'reportData', 'createdAt', 'updatedAt']
    const reportRows = reports.map(r => reportColumns.map(col => (r as any)[col] ?? ''))
    await backupTableToSheet('WeeklyReport', reportColumns, reportRows)

    // 3. ScheduledJob 백업
    const jobs = await prisma.scheduledJob.findMany()
    const jobColumns = ['id', 'name', 'type', 'schedule', 'isActive', 'lastRun', 'nextRun', 'config', 'createdAt', 'updatedAt']
    const jobRows = jobs.map(j => jobColumns.map(col => (j as any)[col] ?? ''))
    await backupTableToSheet('ScheduledJob', jobColumns, jobRows)

    // 4. Setting 백업
    const settings = await prisma.setting.findMany()
    const settingColumns = ['key', 'value']
    const settingRows = settings.map(s => settingColumns.map(col => (s as any)[col] ?? ''))
    await backupTableToSheet('Setting', settingColumns, settingRows)

    console.log('✅ 모든 테이블 백업 완료!')
}

main().catch(console.error) 