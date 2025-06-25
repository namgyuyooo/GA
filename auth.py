"""
Google API 인증 관련 함수들
"""

from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from googleapiclient.discovery import build
import config


def get_credentials():
    """서비스 계정 인증 정보 반환"""
    scopes = [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly'
    ]
    
    credentials = service_account.Credentials.from_service_account_file(
        config.SERVICE_ACCOUNT_FILE,
        scopes=scopes
    )
    
    return credentials


def get_ga4_client():
    """GA4 클라이언트 반환"""
    credentials = get_credentials()
    return BetaAnalyticsDataClient(credentials=credentials)


def get_search_console_service():
    """Search Console 서비스 반환"""
    credentials = get_credentials()
    return build('searchconsole', 'v1', credentials=credentials)


def test_authentication():
    """인증 테스트 함수"""
    try:
        # GA4 인증 테스트
        ga4_client = get_ga4_client()
        print("✓ GA4 인증 성공")
        
        # Search Console 인증 테스트
        gsc_service = get_search_console_service()
        print("✓ Search Console 인증 성공")
        
        return True
    except Exception as e:
        print(f"✗ 인증 실패: {e}")
        return False


if __name__ == "__main__":
    print("인증 테스트 시작...")
    test_authentication()