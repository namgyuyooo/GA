"""
Slack 웹훅을 통한 알림 발송 모듈
"""

import requests
import json
from datetime import datetime
import config


def send_slack_notification(webhook_url, message, blocks=None):
    """Slack 웹훅으로 메시지 발송"""
    payload = {
        "text": message,
        "username": "UTM Report Bot",
        "icon_emoji": ":chart_with_upwards_trend:"
    }
    
    if blocks:
        payload["blocks"] = blocks
    
    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Slack 알림 발송 실패: {e}")
        return False


def create_report_summary_blocks(utm_summary, gsc_summary, report_filename):
    """보고서 요약을 위한 Slack 블록 생성"""
    
    # UTM 캠페인 상위 3개
    top_campaigns = utm_summary.head(3)
    campaign_text = ""
    for _, row in top_campaigns.iterrows():
        campaign_text += f"• *{row['Campaign']}* ({row['Source']}/{row['Medium']}): {row['Sessions']:,}세션, {row['Conversions']}전환\n"
    
    # GSC 상위 키워드 3개
    top_queries = gsc_summary.head(3)
    query_text = ""
    for _, row in top_queries.iterrows():
        query_text += f"• *{row['Query']}*: {row['Clicks']}클릭, {row['Impressions']:,}노출\n"
    
    current_date = datetime.now().strftime('%Y년 %m월 %d일')
    
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"📊 UTM 주간 성과 보고서 ({current_date})",
                "emoji": True
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": f"*총 UTM 캠페인:* {len(utm_summary)}개"
                },
                {
                    "type": "mrkdwn", 
                    "text": f"*총 세션:* {utm_summary['Sessions'].sum():,}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*총 전환:* {utm_summary['Conversions'].sum()}"
                },
                {
                    "type": "mrkdwn",
                    "text": f"*오가닉 키워드:* {len(gsc_summary)}개"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*🎯 주요 UTM 캠페인*\n{campaign_text}"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*🔍 주요 검색 키워드*\n{query_text}"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"📁 상세 보고서: `{report_filename}`"
                }
            ]
        }
    ]
    
    return blocks


def send_weekly_report_notification(webhook_url, utm_data, gsc_data, report_filename):
    """주간 보고서 완성 알림"""
    
    # 데이터 요약
    utm_summary = utm_data.groupby(['Campaign', 'Source', 'Medium']).agg({
        'Sessions': 'sum',
        'Users': 'sum', 
        'Conversions': 'sum'
    }).sort_values('Sessions', ascending=False).reset_index()
    
    gsc_summary = gsc_data.sort_values('Clicks', ascending=False)
    
    # 기본 메시지
    message = f"📈 UTM 주간 성과 보고서가 생성되었습니다!\n• 캠페인 {len(utm_summary)}개 분석\n• 키워드 {len(gsc_summary)}개 분석"
    
    # 상세 블록 생성
    blocks = create_report_summary_blocks(utm_summary, gsc_summary, report_filename)
    
    return send_slack_notification(webhook_url, message, blocks)


def send_error_notification(webhook_url, error_message, step):
    """에러 발생 시 알림"""
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "❌ UTM 보고서 생성 오류",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*오류 발생 단계:* {step}\n*오류 내용:* ```{error_message}```"
            }
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"⏰ 발생 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                }
            ]
        }
    ]
    
    message = f"UTM 보고서 생성 중 오류가 발생했습니다: {step}"
    return send_slack_notification(webhook_url, message, blocks)


def send_alert_notification(webhook_url, alert_type, threshold_data):
    """임계값 기반 알림 (성과 급감/급증 등)"""
    blocks = [
        {
            "type": "header", 
            "text": {
                "type": "plain_text",
                "text": f"🚨 성과 {alert_type} 알림",
                "emoji": True
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": f"*알림 유형:* {alert_type}\n*상세 내용:*\n{threshold_data}"
            }
        }
    ]
    
    message = f"UTM 성과에 {alert_type} 상황이 감지되었습니다."
    return send_slack_notification(webhook_url, message, blocks)


if __name__ == "__main__":
    # 테스트 메시지 발송
    test_webhook = "YOUR_SLACK_WEBHOOK_URL"
    
    test_message = "UTM 보고서 자동화 시스템 테스트 메시지입니다!"
    
    print("Slack 알림 테스트 중...")
    result = send_slack_notification(test_webhook, test_message)
    print(f"테스트 결과: {'성공' if result else '실패'}")