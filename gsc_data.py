"""
Google Search Console 데이터 수집 모듈
오가닉 검색 성과 및 키워드 분석
"""

import pandas as pd
from datetime import datetime, timedelta
from auth import get_search_console_service
import config


def get_date_range():
    """지난주 월요일부터 일요일까지의 날짜 범위 반환"""
    today = datetime.now()
    days_since_monday = today.weekday()
    start_of_last_week = today - timedelta(days=days_since_monday + 7)
    end_of_last_week = start_of_last_week + timedelta(days=6)
    
    return start_of_last_week.strftime('%Y-%m-%d'), end_of_last_week.strftime('%Y-%m-%d')


def get_search_performance_data():
    """검색 성과 데이터 (키워드별)"""
    service = get_search_console_service()
    start_date, end_date = get_date_range()
    
    request_body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['query'],
        'rowLimit': config.REPORT_SETTINGS['top_queries_limit']
    }
    
    response = service.searchanalytics().query(
        siteUrl=config.GSC_SITE_URL, 
        body=request_body
    ).execute()
    
    rows = []
    if 'rows' in response:
        for row in response['rows']:
            rows.append([
                row['keys'][0],  # Query
                row['clicks'],
                row['impressions'],
                row['ctr'],
                row['position']
            ])
    
    df = pd.DataFrame(rows, columns=[
        'Query', 'Clicks', 'Impressions', 'CTR', 'Position'
    ])
    
    return df


def get_page_performance_data():
    """페이지별 검색 성과 데이터"""
    service = get_search_console_service()
    start_date, end_date = get_date_range()
    
    request_body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['page'],
        'rowLimit': 100
    }
    
    response = service.searchanalytics().query(
        siteUrl=config.GSC_SITE_URL, 
        body=request_body
    ).execute()
    
    rows = []
    if 'rows' in response:
        for row in response['rows']:
            rows.append([
                row['keys'][0],  # Page
                row['clicks'],
                row['impressions'],
                row['ctr'],
                row['position']
            ])
    
    df = pd.DataFrame(rows, columns=[
        'Page', 'Clicks', 'Impressions', 'CTR', 'Position'
    ])
    
    return df


def get_query_page_performance():
    """키워드-페이지 조합별 성과 데이터"""
    service = get_search_console_service()
    start_date, end_date = get_date_range()
    
    request_body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['query', 'page'],
        'rowLimit': 200
    }
    
    response = service.searchanalytics().query(
        siteUrl=config.GSC_SITE_URL, 
        body=request_body
    ).execute()
    
    rows = []
    if 'rows' in response:
        for row in response['rows']:
            rows.append([
                row['keys'][0],  # Query
                row['keys'][1],  # Page
                row['clicks'],
                row['impressions'],
                row['ctr'],
                row['position']
            ])
    
    df = pd.DataFrame(rows, columns=[
        'Query', 'Page', 'Clicks', 'Impressions', 'CTR', 'Position'
    ])
    
    return df


def get_daily_search_trend():
    """일별 검색 트렌드 데이터"""
    service = get_search_console_service()
    start_date, end_date = get_date_range()
    
    request_body = {
        'startDate': start_date,
        'endDate': end_date,
        'dimensions': ['date'],
        'rowLimit': 25000
    }
    
    response = service.searchanalytics().query(
        siteUrl=config.GSC_SITE_URL, 
        body=request_body
    ).execute()
    
    rows = []
    if 'rows' in response:
        for row in response['rows']:
            rows.append([
                row['keys'][0],  # Date
                row['clicks'],
                row['impressions'],
                row['ctr'],
                row['position']
            ])
    
    df = pd.DataFrame(rows, columns=[
        'Date', 'Clicks', 'Impressions', 'CTR', 'Position'
    ])
    
    # 날짜 형식 변환
    df['Date'] = pd.to_datetime(df['Date'])
    
    return df


if __name__ == "__main__":
    print("Google Search Console 데이터 수집 테스트 중...")
    try:
        search_data = get_search_performance_data()
        print(f"검색 성과 데이터: {len(search_data)} 행")
        print(search_data.head())
        
        page_data = get_page_performance_data()
        print(f"페이지 성과 데이터: {len(page_data)} 행")
        
        trend_data = get_daily_search_trend()
        print(f"일별 트렌드 데이터: {len(trend_data)} 행")
        
    except Exception as e:
        print(f"데이터 수집 실패: {e}")