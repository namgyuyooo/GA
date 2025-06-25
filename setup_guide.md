# UTM 주간 보고서 자동화 설정 가이드

## 1. Python 환경 설정

### 필요 라이브러리 설치
```bash
pip install -r requirements.txt
```

### 주요 라이브러리 설명
- `google-analytics-data`: GA4 데이터 수집
- `google-api-python-client`: Google Search Console API
- `pandas`: 데이터 분석 및 처리
- `openpyxl`: Excel 파일 생성

## 2. Google Cloud Console 설정

### 2.1 프로젝트 생성 및 API 활성화
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 다음 API 활성화:
   - Google Analytics Data API
   - Google Search Console API

### 2.2 서비스 계정 생성
1. `API 및 서비스` > `사용자 인증 정보`
2. `+ 사용자 인증 정보 만들기` > `서비스 계정`
3. 서비스 계정 이름 입력
4. 역할: `뷰어(Viewer)` 선택

### 2.3 인증 키 다운로드
1. 생성된 서비스 계정 클릭
2. `키` 탭 > `키 추가` > `새 키 만들기`
3. JSON 형식 선택하여 다운로드
4. 다운로드한 JSON 파일을 프로젝트 폴더에 `service-account-key.json`으로 저장

## 3. Google Analytics 및 Search Console 권한 설정

### 3.1 GA4 권한 부여
1. Google Analytics 관리 페이지 접속
2. `관리` > `속성 액세스 관리`
3. 서비스 계정 이메일 주소 추가 (뷰어 권한)

### 3.2 Search Console 권한 부여
1. Google Search Console 접속
2. `설정` > `사용자 및 권한`
3. 서비스 계정 이메일 주소 추가 (보기 전용 권한)

## 4. 설정 파일 작성

`config.py` 파일에서 다음 값들을 설정하세요:
- `GA4_PROPERTY_ID`: GA4 속성 ID
- `GSC_SITE_URL`: Search Console 사이트 URL
- `SERVICE_ACCOUNT_FILE`: 서비스 계정 JSON 파일 경로