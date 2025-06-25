"""
Google Analytics 4 데이터 수집 모듈
UTM 파라미터 및 주요 마케팅 지표 수집
"""

import pandas as pd
from datetime import datetime, timedelta
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest
from auth import get_ga4_client
import config


def get_date_range():
    """지난주 월요일부터 일요일까지의 날짜 범위 반환"""
    today = datetime.now()
    days_since_monday = today.weekday()
    start_of_last_week = today - timedelta(days=days_since_monday + 7)
    end_of_last_week = start_of_last_week + timedelta(days=6)
    
    return start_of_last_week.strftime('%Y-%m-%d'), end_of_last_week.strftime('%Y-%m-%d')


def get_utm_campaign_data():
    """UTM 캠페인별 성과 데이터 수집"""
    client = get_ga4_client()
    start_date, end_date = get_date_range()
    
    request = RunReportRequest(
        property=f"properties/{config.GA4_PROPERTY_ID}",
        dimensions=[
            Dimension(name="sessionCampaignName"),  # utm_campaign
            Dimension(name="sessionSource"),        # utm_source
            Dimension(name="sessionMedium"),        # utm_medium
            Dimension(name="sessionDefaultChannelGroup")  # 채널 그룹
        ],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="sessions"),
            Metric(name="screenPageViews"),
            Metric(name="engagementRate"),
            Metric(name="averageSessionDuration"),
            Metric(name="conversions")
        ],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        order_bys=[{
            'metric': {'metric_name': 'sessions'},
            'desc': True
        }],
        limit=1000
    )
    
    response = client.run_report(request)
    
    # DataFrame으로 변환
    rows = []
    for row in response.rows:
        rows.append([
            row.dimension_values[0].value,  # Campaign
            row.dimension_values[1].value,  # Source
            row.dimension_values[2].value,  # Medium
            row.dimension_values[3].value,  # Channel Group
            int(row.metric_values[0].value),  # Users
            int(row.metric_values[1].value),  # Sessions
            int(row.metric_values[2].value),  # Page Views
            float(row.metric_values[3].value),  # Engagement Rate
            float(row.metric_values[4].value),  # Avg Session Duration
            int(row.metric_values[5].value)   # Conversions
        ])
    
    df = pd.DataFrame(rows, columns=[
        'Campaign', 'Source', 'Medium', 'Channel_Group', 
        'Users', 'Sessions', 'Page_Views', 'Engagement_Rate', 
        'Avg_Session_Duration', 'Conversions'
    ])
    
    return df


def get_landing_page_data():
    """UTM 랜딩 페이지별 성과 데이터 수집"""
    client = get_ga4_client()
    start_date, end_date = get_date_range()
    
    request = RunReportRequest(
        property=f"properties/{config.GA4_PROPERTY_ID}",
        dimensions=[
            Dimension(name="landingPagePlusQueryString"),
            Dimension(name="sessionCampaignName"),
            Dimension(name="sessionSource"),
            Dimension(name="sessionMedium")
        ],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="sessions"),
            Metric(name="bounceRate"),
            Metric(name="conversions")
        ],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimension_filter={
            'filter': {
                'field_name': 'sessionCampaignName',
                'string_filter': {
                    'match_type': 'PARTIAL_REGEXP',
                    'value': r'^(?!\(not set\)|\(direct\)).*'  # (not set)과 (direct) 제외
                }
            }
        },
        order_bys=[{
            'metric': {'metric_name': 'sessions'},
            'desc': True
        }],
        limit=500
    )
    
    response = client.run_report(request)
    
    rows = []
    for row in response.rows:
        rows.append([
            row.dimension_values[0].value,  # Landing Page
            row.dimension_values[1].value,  # Campaign
            row.dimension_values[2].value,  # Source
            row.dimension_values[3].value,  # Medium
            int(row.metric_values[0].value),  # Users
            int(row.metric_values[1].value),  # Sessions
            float(row.metric_values[2].value),  # Bounce Rate
            int(row.metric_values[3].value)   # Conversions
        ])
    
    df = pd.DataFrame(rows, columns=[
        'Landing_Page', 'Campaign', 'Source', 'Medium',
        'Users', 'Sessions', 'Bounce_Rate', 'Conversions'
    ])
    
    return df


def get_daily_utm_trend():
    """일별 UTM 트래픽 트렌드 데이터"""
    client = get_ga4_client()
    start_date, end_date = get_date_range()
    
    request = RunReportRequest(
        property=f"properties/{config.GA4_PROPERTY_ID}",
        dimensions=[
            Dimension(name="date"),
            Dimension(name="sessionDefaultChannelGroup")
        ],
        metrics=[
            Metric(name="activeUsers"),
            Metric(name="sessions"),
            Metric(name="conversions")
        ],
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        order_bys=[{
            'dimension': {'dimension_name': 'date'},
            'desc': False
        }]
    )
    
    response = client.run_report(request)
    
    rows = []
    for row in response.rows:
        rows.append([
            row.dimension_values[0].value,  # Date
            row.dimension_values[1].value,  # Channel Group
            int(row.metric_values[0].value),  # Users
            int(row.metric_values[1].value),  # Sessions
            int(row.metric_values[2].value)   # Conversions
        ])
    
    df = pd.DataFrame(rows, columns=[
        'Date', 'Channel_Group', 'Users', 'Sessions', 'Conversions'
    ])
    
    # 날짜 형식 변환
    df['Date'] = pd.to_datetime(df['Date'])
    
    return df


if __name__ == "__main__":
    print("GA4 데이터 수집 테스트 중...")
    try:
        utm_data = get_utm_campaign_data()
        print(f"UTM 캠페인 데이터: {len(utm_data)} 행")
        print(utm_data.head())
        
        landing_data = get_landing_page_data()
        print(f"랜딩 페이지 데이터: {len(landing_data)} 행")
        
        trend_data = get_daily_utm_trend()
        print(f"일별 트렌드 데이터: {len(trend_data)} 행")
        
    except Exception as e:
        print(f"데이터 수집 실패: {e}")