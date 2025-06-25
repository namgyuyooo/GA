// 데이터 소스 및 계산 방법론 설명

export const DATA_SOURCES = {
  GA4: {
    name: 'Google Analytics 4',
    description: 'Google Analytics 4 Reporting API를 통해 실시간으로 수집된 웹사이트 및 앱 사용 데이터',
    apiEndpoint: 'https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport',
    updateFrequency: '실시간 (최대 24시간 지연)',
    dataRetention: '기본 14개월 (설정에 따라 최대 50개월)',
    limitations: [
      '샘플링이 적용될 수 있음 (대용량 데이터)',
      '(not provided) 키워드는 개인정보보호로 인해 제한',
      '실시간 데이터는 처리 지연이 있을 수 있음'
    ]
  },
  GSC: {
    name: 'Google Search Console',
    description: 'Google 검색 결과에서의 웹사이트 성과 데이터',
    apiEndpoint: 'https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query',
    updateFrequency: '일 1회 (2-3일 지연)',
    dataRetention: '16개월',
    limitations: [
      '개인정보보호를 위한 데이터 집계',
      '낮은 검색량 키워드는 표시되지 않음',
      '클릭 및 노출 데이터만 제공'
    ]
  },
  GTM: {
    name: 'Google Tag Manager',
    description: 'GTM 컨테이너의 태그, 트리거, 변수 구성 정보',
    apiEndpoint: 'https://tagmanager.googleapis.com/tagmanager/v2/accounts/{accountId}/containers/{containerId}',
    updateFrequency: '실시간 (컨테이너 게시 시)',
    dataRetention: '무제한',
    limitations: [
      '컨테이너 구성 정보만 제공',
      '실제 태그 실행 데이터는 별도 분석 필요',
      '권한이 있는 컨테이너만 접근 가능'
    ]
  },
  SHEETS: {
    name: 'Google Sheets',
    description: '사용자가 관리하는 UTM 캠페인 및 Goal 설정 데이터',
    apiEndpoint: 'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}',
    updateFrequency: '수동 업데이트',
    dataRetention: '무제한',
    limitations: [
      '수동 데이터 입력 필요',
      '데이터 정합성은 사용자 관리',
      '스프레드시트 권한 필요'
    ]
  }
}

export const CALCULATIONS = {
  BOUNCE_RATE: {
    title: '이탈률',
    formula: '(단일 페이지 세션 수 / 전체 세션 수) × 100',
    description: '사용자가 하나의 페이지만 보고 떠난 세션의 비율',
    dataSource: 'GA4',
    notes: [
      'GA4에서는 참여 세션의 반대 개념으로 계산',
      '10초 이상 체류, 전환 이벤트 발생, 2페이지 이상 조회 시 참여 세션으로 분류',
      '높은 이탈률이 반드시 나쁜 것은 아님 (블로그, 뉴스 사이트 등)'
    ]
  },
  SESSION_DURATION: {
    title: '평균 세션 지속시간',
    formula: '총 세션 지속시간 / 세션 수',
    description: '사용자가 웹사이트에서 보낸 평균 시간',
    dataSource: 'GA4',
    notes: [
      '이탈 세션은 0초로 계산됨',
      '마지막 페이지 체류시간은 측정되지 않음',
      '참여도가 높은 콘텐츠 식별에 유용'
    ]
  },
  CONVERSION_RATE: {
    title: '전환율',
    formula: '(전환 수 / 세션 수) × 100',
    description: '목표 달성 세션의 비율',
    dataSource: 'GA4',
    notes: [
      'GA4 전환 이벤트 기반으로 계산',
      '전환 목표는 GTM 또는 GA4에서 설정',
      '여러 전환이 한 세션에서 발생할 수 있음'
    ]
  },
  COHORT_RETENTION: {
    title: '코호트 리텐션',
    formula: '(기간별 재방문 사용자 수 / 초기 코호트 사용자 수) × 100',
    description: '특정 기간에 획득된 사용자가 이후 기간에 재방문하는 비율',
    dataSource: 'GA4',
    notes: [
      '사용자 첫 방문일 기준으로 코호트 생성',
      '주간, 월간 리텐션으로 분석',
      '장기적인 사용자 참여도 측정에 유용'
    ]
  },
  UTM_ATTRIBUTION: {
    title: 'UTM 기여도 분석',
    formula: 'Last-click Attribution 기반 세션 및 전환 추적',
    description: 'UTM 매개변수를 통한 캠페인별 성과 측정',
    dataSource: 'GA4 + Google Sheets',
    notes: [
      '마지막 클릭 기여 모델 적용',
      '등록된 UTM 캠페인과 자연 유입 구분',
      '크로스 디바이스 추적에 제한'
    ]
  },
  KEYWORD_PERFORMANCE: {
    title: '키워드 성과 분석',
    formula: 'GSC 노출/클릭 + GA4 세션/전환 데이터 결합',
    description: '검색어별 노출부터 전환까지의 전체 퍼널 분석',
    dataSource: 'GSC + GA4',
    notes: [
      'GSC는 검색 노출 및 클릭 데이터 제공',
      'GA4는 세션 및 전환 데이터 제공',
      '개인정보보호로 인한 데이터 제한 존재'
    ]
  },
  TRAFFIC_CATEGORIZATION: {
    title: '트래픽 소스 분류',
    formula: 'source/medium 조합을 통한 자동 카테고리 분류',
    description: '트래픽을 전략적 카테고리로 분류하여 분석',
    dataSource: 'GA4 + Google Sheets',
    notes: [
      'organic, direct, referral, social, paid 등으로 분류',
      '등록된 UTM 캠페인은 별도 분류',
      '사용자 정의 분류 규칙 적용 가능'
    ]
  },
  GTM_GOAL_TRACKING: {
    title: 'GTM Goal 추적',
    formula: 'GTM 태그 실행 이벤트를 GA4 전환 이벤트로 매핑',
    description: 'GTM에서 설정된 태그를 Goal로 설정하여 전환 추적',
    dataSource: 'GTM + GA4',
    notes: [
      'GTM 태그 실행이 GA4 이벤트로 전달되어야 함',
      'Goal 우선순위에 따른 가중치 적용',
      '태그 실행 조건(트리거) 확인 필요'
    ]
  }
}

export const METRIC_EXPLANATIONS = {
  sessions: {
    title: '세션',
    description: '사용자가 웹사이트를 방문하여 상호작용한 기간',
    calculation: CALCULATIONS.SESSION_DURATION,
    benchmark: '업계 평균: 2-4분',
    interpretation: {
      good: '높은 세션 수는 트래픽 증가를 의미',
      bad: '세션 품질도 함께 고려해야 함',
      actions: ['트래픽 소스별 세션 품질 분석', '사용자 경험 개선']
    }
  },
  users: {
    title: '사용자',
    description: '특정 기간 동안 웹사이트를 방문한 고유 사용자 수',
    calculation: {
      title: '고유 사용자 계산',
      formula: 'Client ID 기반 중복 제거',
      dataSource: 'GA4',
      notes: ['쿠키 및 사용자 ID 기반', '크로스 디바이스 추적 제한']
    },
    benchmark: '신규 사용자 비율: 60-80%',
    interpretation: {
      good: '꾸준한 신규 사용자 유입',
      bad: '사용자 재방문율 저조',
      actions: ['콘텐츠 품질 개선', '재방문 유도 전략']
    }
  },
  pageViews: {
    title: '페이지뷰',
    description: '페이지가 로드된 총 횟수',
    calculation: {
      title: '페이지뷰 계산',
      formula: '각 페이지 로드 이벤트의 합계',
      dataSource: 'GA4',
      notes: ['동일 페이지 새로고침도 포함', 'SPA는 별도 설정 필요']
    },
    benchmark: '페이지당 체류시간: 1-3분',
    interpretation: {
      good: '높은 페이지뷰는 사용자 참여도 증가',
      bad: '이탈률과 함께 분석 필요',
      actions: ['인기 페이지 분석', '사용자 경로 최적화']
    }
  },
  conversions: {
    title: '전환',
    description: '설정된 목표를 달성한 이벤트 수',
    calculation: CALCULATIONS.CONVERSION_RATE,
    benchmark: '업계별 상이 (1-5%)',
    interpretation: {
      good: '목표 달성률 증가',
      bad: '전환 경로 분석 필요',
      actions: ['전환 퍼널 최적화', 'A/B 테스트 실행']
    }
  }
}

export function getDataSourceInfo(source: keyof typeof DATA_SOURCES) {
  return DATA_SOURCES[source]
}

export function getCalculationInfo(calculation: keyof typeof CALCULATIONS) {
  return CALCULATIONS[calculation]
}

export function getMetricExplanation(metric: keyof typeof METRIC_EXPLANATIONS) {
  return METRIC_EXPLANATIONS[metric]
}