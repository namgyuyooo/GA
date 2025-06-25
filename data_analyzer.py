"""
데이터 분석 및 처리 로직
UTM 성과 분석, 트렌드 비교, 이상치 탐지
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def analyze_utm_performance(utm_data):
    """UTM 캠페인 성과 분석"""
    
    # 1. 캠페인별 성과 요약
    campaign_summary = utm_data.groupby(['Campaign', 'Source', 'Medium']).agg({
        'Users': 'sum',
        'Sessions': 'sum', 
        'Page_Views': 'sum',
        'Conversions': 'sum',
        'Engagement_Rate': 'mean',
        'Avg_Session_Duration': 'mean'
    }).reset_index()
    
    # 성과 지표 계산
    campaign_summary['Conversion_Rate'] = (
        campaign_summary['Conversions'] / campaign_summary['Sessions'] * 100
    ).round(2)
    
    campaign_summary['Pages_Per_Session'] = (
        campaign_summary['Page_Views'] / campaign_summary['Sessions']
    ).round(2)
    
    # 세션 기준 정렬
    campaign_summary = campaign_summary.sort_values('Sessions', ascending=False)
    
    return campaign_summary


def analyze_channel_performance(utm_data):
    """채널별 성과 분석"""
    
    channel_summary = utm_data.groupby('Channel_Group').agg({
        'Users': 'sum',
        'Sessions': 'sum',
        'Conversions': 'sum',
        'Engagement_Rate': 'mean'
    }).reset_index()
    
    # 채널별 점유율 계산
    total_sessions = channel_summary['Sessions'].sum()
    channel_summary['Session_Share'] = (
        channel_summary['Sessions'] / total_sessions * 100
    ).round(2)
    
    channel_summary['Conversion_Rate'] = (
        channel_summary['Conversions'] / channel_summary['Sessions'] * 100
    ).round(2)
    
    return channel_summary.sort_values('Sessions', ascending=False)


def analyze_landing_page_performance(landing_data):
    """랜딩 페이지 성과 분석"""
    
    page_summary = landing_data.groupby('Landing_Page').agg({
        'Users': 'sum',
        'Sessions': 'sum',
        'Conversions': 'sum',
        'Bounce_Rate': 'mean'
    }).reset_index()
    
    page_summary['Conversion_Rate'] = (
        page_summary['Conversions'] / page_summary['Sessions'] * 100
    ).round(2)
    
    # 성과 기준 정렬 (전환율 높은 순)
    page_summary = page_summary.sort_values('Conversion_Rate', ascending=False)
    
    return page_summary


def analyze_search_performance(gsc_data):
    """검색 성과 분석"""
    
    # 1. 상위 키워드 분석
    top_keywords = gsc_data.head(20).copy()
    
    # 2. CTR 기준 분석 (CTR 5% 이상 고성과 키워드)
    high_ctr_keywords = gsc_data[gsc_data['CTR'] >= 0.05].sort_values('Clicks', ascending=False)
    
    # 3. 노출 대비 클릭 부족 키워드 (노출 많지만 CTR 낮음)
    low_ctr_high_impressions = gsc_data[
        (gsc_data['Impressions'] >= 1000) & (gsc_data['CTR'] <= 0.02)
    ].sort_values('Impressions', ascending=False)
    
    # 4. 순위 개선 가능 키워드 (4~10위)
    rank_improvement_opportunity = gsc_data[
        (gsc_data['Position'] >= 4) & (gsc_data['Position'] <= 10)
    ].sort_values('Impressions', ascending=False)
    
    return {
        'top_keywords': top_keywords,
        'high_ctr_keywords': high_ctr_keywords,
        'low_ctr_opportunities': low_ctr_high_impressions,
        'rank_opportunities': rank_improvement_opportunity
    }


def detect_performance_anomalies(current_data, historical_data=None):
    """성과 이상치 탐지 (급증/급감)"""
    
    anomalies = []
    
    if historical_data is not None:
        # 이전 주 대비 변화율 계산
        for metric in ['Sessions', 'Users', 'Conversions']:
            current_total = current_data[metric].sum()
            historical_total = historical_data[metric].sum()
            
            if historical_total > 0:
                change_pct = ((current_total - historical_total) / historical_total * 100)
                
                if abs(change_pct) >= 30:  # 30% 이상 변화
                    anomalies.append({
                        'metric': metric,
                        'change_pct': round(change_pct, 2),
                        'current_value': current_total,
                        'previous_value': historical_total,
                        'alert_type': '급증' if change_pct > 0 else '급감'
                    })
    
    # 캠페인별 이상치 탐지 (Z-score 기반)
    sessions_mean = current_data['Sessions'].mean()
    sessions_std = current_data['Sessions'].std()
    
    if sessions_std > 0:
        current_data['Sessions_ZScore'] = (
            (current_data['Sessions'] - sessions_mean) / sessions_std
        )
        
        # Z-score 2 이상인 캠페인 (통계적 이상치)
        outlier_campaigns = current_data[
            abs(current_data['Sessions_ZScore']) >= 2
        ][['Campaign', 'Source', 'Medium', 'Sessions', 'Sessions_ZScore']]
        
        if len(outlier_campaigns) > 0:
            anomalies.append({
                'type': 'campaign_outliers',
                'data': outlier_campaigns
            })
    
    return anomalies


def generate_insights(utm_summary, channel_summary, search_analysis):
    """데이터 기반 인사이트 생성"""
    
    insights = []
    
    # 1. 최고 성과 캠페인
    top_campaign = utm_summary.iloc[0]
    insights.append(
        f"🏆 최고 성과 캠페인: '{top_campaign['Campaign']}' "
        f"({top_campaign['Sessions']:,}세션, {top_campaign['Conversions']}전환)"
    )
    
    # 2. 전환율 기준 최고 캠페인
    if len(utm_summary) > 0:
        best_conversion_campaign = utm_summary.loc[utm_summary['Conversion_Rate'].idxmax()]
        insights.append(
            f"💰 최고 전환율 캠페인: '{best_conversion_campaign['Campaign']}' "
            f"({best_conversion_campaign['Conversion_Rate']}%)"
        )
    
    # 3. 주요 트래픽 채널
    top_channel = channel_summary.iloc[0]
    insights.append(
        f"📈 주요 트래픽 채널: {top_channel['Channel_Group']} "
        f"({top_channel['Session_Share']}% 점유율)"
    )
    
    # 4. 검색 성과 인사이트
    top_keyword = search_analysis['top_keywords'].iloc[0]
    insights.append(
        f"🔍 최고 검색 키워드: '{top_keyword['Query']}' "
        f"({top_keyword['Clicks']}클릭, {top_keyword['CTR']*100:.1f}% CTR)"
    )
    
    # 5. 개선 기회
    if len(search_analysis['low_ctr_opportunities']) > 0:
        low_ctr_keyword = search_analysis['low_ctr_opportunities'].iloc[0]
        insights.append(
            f"⚠️ CTR 개선 기회: '{low_ctr_keyword['Query']}' "
            f"({low_ctr_keyword['Impressions']:,}노출, {low_ctr_keyword['CTR']*100:.1f}% CTR)"
        )
    
    return insights


def create_performance_summary(utm_data, gsc_data):
    """전체 성과 요약 생성"""
    
    # 기본 통계
    total_sessions = utm_data['Sessions'].sum()
    total_users = utm_data['Users'].sum()
    total_conversions = utm_data['Conversions'].sum()
    total_clicks = gsc_data['Clicks'].sum()
    total_impressions = gsc_data['Impressions'].sum()
    
    # 평균 지표
    avg_engagement_rate = utm_data['Engagement_Rate'].mean()
    avg_ctr = gsc_data['CTR'].mean()
    avg_position = gsc_data['Position'].mean()
    
    # 캠페인/키워드 수
    unique_campaigns = utm_data['Campaign'].nunique()
    unique_keywords = len(gsc_data)
    
    summary = {
        'period': '지난주',
        'utm_performance': {
            'total_sessions': total_sessions,
            'total_users': total_users,
            'total_conversions': total_conversions,
            'avg_engagement_rate': round(avg_engagement_rate, 4),
            'unique_campaigns': unique_campaigns
        },
        'search_performance': {
            'total_clicks': total_clicks,
            'total_impressions': total_impressions,
            'avg_ctr': round(avg_ctr, 4),
            'avg_position': round(avg_position, 1),
            'unique_keywords': unique_keywords
        }
    }
    
    return summary


if __name__ == "__main__":
    print("데이터 분석 모듈 테스트...")
    
    # 테스트용 더미 데이터
    test_utm_data = pd.DataFrame({
        'Campaign': ['summer_sale', 'brand_awareness', 'summer_sale'],
        'Source': ['google', 'facebook', 'naver'],
        'Medium': ['cpc', 'social', 'cpc'],
        'Channel_Group': ['Paid Search', 'Social', 'Paid Search'],
        'Users': [1000, 500, 300],
        'Sessions': [1200, 600, 350],
        'Page_Views': [2400, 900, 700],
        'Conversions': [50, 15, 20],
        'Engagement_Rate': [0.75, 0.65, 0.80],
        'Avg_Session_Duration': [120, 90, 110]
    })
    
    utm_summary = analyze_utm_performance(test_utm_data)
    print("UTM 분석 완료:", len(utm_summary), "행")