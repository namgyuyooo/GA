const { PrismaClient } = require('@prisma/client')
const cron = require('node-cron')

const prisma = new PrismaClient()

// 주간 보고서 생성 함수
async function generateWeeklyReport() {
  try {
    console.log('주간 보고서 생성 시작...')
    
    // 활성 스케줄 조회
    const schedule = await prisma.weeklyReportSchedule.findFirst({
      where: { isActive: true }
    })

    if (!schedule) {
      console.log('활성 스케줄이 없습니다.')
      return
    }

    // 현재 시간이 스케줄 시간과 일치하는지 확인
    const now = new Date()
    const scheduleTime = new Date()
    scheduleTime.setHours(schedule.hour, schedule.minute, 0, 0)

    // 요일 확인 (0=일요일, 1=월요일, ..., 6=토요일)
    if (now.getDay() !== schedule.dayOfWeek) {
      console.log('오늘은 스케줄된 요일이 아닙니다.')
      return
    }

    // 시간 확인 (5분 여유)
    const timeDiff = Math.abs(now - scheduleTime)
    if (timeDiff > 5 * 60 * 1000) { // 5분
      console.log('스케줄 시간이 아닙니다.')
      return
    }

    // 주간 보고서 생성 API 호출
    const response = await fetch('http://localhost:3001/api/weekly-report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        test: false,
        schedule: {
          name: schedule.name,
          isActive: schedule.isActive,
          dayOfWeek: schedule.dayOfWeek,
          hour: schedule.hour,
          minute: schedule.minute,
          timezone: schedule.timezone,
          recipients: schedule.recipients ? JSON.parse(schedule.recipients) : [],
          includeSummary: schedule.includeSummary,
          includeIssues: schedule.includeIssues,
          includeAI: schedule.includeAI,
          aiPrompt: schedule.aiPrompt,
          propertyIds: schedule.propertyIds ? JSON.parse(schedule.propertyIds) : []
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('주간 보고서 생성 완료:', result.message)
      
      // 이메일 발송 (수신자가 있는 경우)
      const recipients = schedule.recipients ? JSON.parse(schedule.recipients) : []
      if (recipients.length > 0) {
        await sendEmailReport(recipients, result.report)
      }
    } else {
      console.error('주간 보고서 생성 실패')
    }

  } catch (error) {
    console.error('주간 보고서 생성 중 오류:', error)
  }
}

// 이메일 발송 함수 (실제 구현 시 이메일 서비스 연동)
async function sendEmailReport(recipients, report) {
  try {
    console.log(`${recipients.join(', ')}에게 주간 보고서를 발송합니다.`)
    
    // 실제 이메일 발송 로직 (예: SendGrid, AWS SES 등)
    // 여기에 이메일 발송 코드를 추가
    
    console.log('이메일 발송 완료')
  } catch (error) {
    console.error('이메일 발송 중 오류:', error)
  }
}

// 스케줄러 시작
function startScheduler() {
  console.log('스케줄러를 시작합니다...')
  
  // 매분마다 체크 (실제 운영에서는 더 정밀한 스케줄링 필요)
  cron.schedule('* * * * *', async () => {
    await generateWeeklyReport()
  })
  
  console.log('스케줄러가 시작되었습니다. 매분마다 스케줄을 확인합니다.')
}

// 스케줄러 중지
function stopScheduler() {
  console.log('스케줄러를 중지합니다...')
  process.exit(0)
}

// 프로세스 종료 시 정리
process.on('SIGINT', stopScheduler)
process.on('SIGTERM', stopScheduler)

// 스케줄러 시작
startScheduler() 