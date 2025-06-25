# UTM 주간 보고서 자동화 설정 파일

# Google Analytics 4 설정
GA4_PROPERTY_ID = 'YOUR_GA4_PROPERTY_ID'  # 예: '123456789'

# Google Search Console 설정
GSC_SITE_URL = 'YOUR_GSC_SITE_URL'  # 예: 'https://www.yourdomain.com/' 또는 'sc-domain:yourdomain.com'

# 인증 파일 경로
SERVICE_ACCOUNT_FILE = 'service-account-key.json'

# 보고서 설정
REPORT_SETTINGS = {
    'output_filename': 'weekly_utm_report.xlsx',
    'top_queries_limit': 50,
    'top_campaigns_limit': 20
}

# Slack 웹훅 설정
SLACK_SETTINGS = {
    'webhook_url': 'YOUR_SLACK_WEBHOOK_URL',  # https://hooks.slack.com/services/...
    'channel': '#marketing',  # 알림을 받을 채널
    'enable_alerts': True,    # 성과 알림 활성화
    'alert_thresholds': {
        'session_drop_pct': 30,    # 세션 30% 이상 감소 시 알림
        'conversion_drop_pct': 50,  # 전환 50% 이상 감소 시 알림
    }
}

# 이메일 설정 (선택사항)
EMAIL_SETTINGS = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'your-email@gmail.com',
    'sender_password': 'your-app-password',  # Gmail 앱 비밀번호
    'recipient_emails': ['recipient1@company.com', 'recipient2@company.com'],
    'subject': 'UTM 주간 성과 보고서'
}