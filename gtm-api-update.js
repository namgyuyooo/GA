// GTM API 업데이트 스크립트 (자동 생성됨)
// 이 코드를 GTM 분석 API에 통합하여 Goal 데이터를 로드하세요

const loadUTMGoals = () => {
  const goalTags = [
    {
      id: 'utm_goal_1',
      name: 'UTM Goal - campain_name',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_1'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'sms',
        },
        {
          key: 'utm_medium',
          value: 'social',
        },
        {
          key: 'utm_campaign',
          value: 'campain_name',
        },
        {
          key: 'custom_parameter_1',
          value: '구글 디스플레이광고 - 프로모션',
        },
      ],
      fingerprint: 'utm-goal-1-fingerprint',
      isGoal: true,
      goalPriority: 1,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 구글 디스플레이광고 - 프로모션',
      originalUTM: {
        ID: '1',
        관리메모: '구글 디스플레이광고 - 프로모션',
        랜딩페이지URL: 'http://rtm.ai',
        소스: 'sms',
        매체: 'social',
        캠페인: 'campain_name',
        UTM_Content: '',
        UTM_Term: '',
        finalURL: 'http://rtm.ai?utm_source=sms&utm_medium=social&utm_campaign=campain_name',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_2',
      name: 'UTM Goal - welcome_auto',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_2'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: 'welcome_auto',
        },
        {
          key: 'custom_parameter_1',
          value: '온라인 poc 프로젝트 페이지',
        },
      ],
      fingerprint: 'utm-goal-2-fingerprint',
      isGoal: true,
      goalPriority: 2,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 온라인 poc 프로젝트 페이지',
      originalUTM: {
        ID: '2',
        관리메모: '온라인 poc 프로젝트 페이지',
        랜딩페이지URL: 'https://poc-request.hubble-engine.rtm.ai/project/auth',
        소스: 'email',
        매체: 'email',
        캠페인: 'welcome_auto',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://poc-request.hubble-engine.rtm.ai/project/auth?utm_source=email&utm_medium=email&utm_campaign=welcome_auto',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_3',
      name: 'UTM Goal - aw_thanks_mail',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_3'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: 'aw_thanks_mail',
        },
        {
          key: 'custom_parameter_1',
          value: '온라인 poc 신청페이지 aw 감사메일',
        },
      ],
      fingerprint: 'utm-goal-3-fingerprint',
      isGoal: true,
      goalPriority: 3,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 온라인 poc 신청페이지 aw 감사메일',
      originalUTM: {
        ID: '3',
        관리메모: '온라인 poc 신청페이지 aw 감사메일',
        랜딩페이지URL: 'https://poc-request.hubble-engine.rtm.ai/',
        소스: 'email',
        매체: 'email',
        캠페인: 'aw_thanks_mail',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://poc-request.hubble-engine.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=aw_thanks_mail',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_4',
      name: 'UTM Goal - bluepoint_demoday-offline',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_4'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: 'bluepoint_demoday-offline',
        },
        {
          key: 'custom_parameter_1',
          value: '온라인 poc 랜딩페이지',
        },
      ],
      fingerprint: 'utm-goal-4-fingerprint',
      isGoal: true,
      goalPriority: 4,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 온라인 poc 랜딩페이지',
      originalUTM: {
        ID: '4',
        관리메모: '온라인 poc 랜딩페이지',
        랜딩페이지URL: 'https://online-poc.rtm.ai/',
        소스: 'email',
        매체: 'email',
        캠페인: 'bluepoint_demoday-offline',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://online-poc.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=bluepoint_demoday-offline',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_5',
      name: 'UTM Goal - 250319_email_onlicepoc_welcome',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_5'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: '250319_email_onlicepoc_welcome',
        },
        {
          key: 'custom_parameter_1',
          value: '온라인 poc 신청페이지 메일',
        },
      ],
      fingerprint: 'utm-goal-5-fingerprint',
      isGoal: true,
      goalPriority: 5,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 온라인 poc 신청페이지 메일',
      originalUTM: {
        ID: '5',
        관리메모: '온라인 poc 신청페이지 메일',
        랜딩페이지URL: 'http://rtm.ai',
        소스: 'email',
        매체: 'email',
        캠페인: '250319_email_onlicepoc_welcome',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'http://rtm.ai?utm_source=email&utm_medium=email&utm_campaign=250319_email_onlicepoc_welcome',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_6',
      name: 'UTM Goal - basic',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_6'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'homepage',
        },
        {
          key: 'utm_medium',
          value: 'btn',
        },
        {
          key: 'utm_campaign',
          value: 'basic',
        },
        {
          key: 'custom_parameter_1',
          value: '홈페이지-poc 랜딩 이동',
        },
      ],
      fingerprint: 'utm-goal-6-fingerprint',
      isGoal: true,
      goalPriority: 6,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 홈페이지-poc 랜딩 이동',
      originalUTM: {
        ID: '6',
        관리메모: '홈페이지-poc 랜딩 이동',
        랜딩페이지URL: 'https://online-poc.rtm.ai/',
        소스: 'homepage',
        매체: 'btn',
        캠페인: 'basic',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://online-poc.rtm.ai/?utm_source=homepage&utm_medium=btn&utm_campaign=basic',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_7',
      name: 'UTM Goal - 250424_email_poc_maillist',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_7'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: '250424_email_poc_maillist',
        },
        {
          key: 'custom_parameter_1',
          value: '온라인 poc 신청페이지 메일',
        },
      ],
      fingerprint: 'utm-goal-7-fingerprint',
      isGoal: true,
      goalPriority: 7,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 온라인 poc 신청페이지 메일',
      originalUTM: {
        ID: '7',
        관리메모: '온라인 poc 신청페이지 메일',
        랜딩페이지URL: 'https://online-poc.rtm.ai/',
        소스: 'email',
        매체: 'email',
        캠페인: '250424_email_poc_maillist',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://online-poc.rtm.ai/?utm_source=email&utm_medium=email&utm_campaign=250424_email_poc_maillist',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
    {
      id: 'utm_goal_8',
      name: 'UTM Goal - 250604_email-engine_maillist',
      type: 'gaEvent',
      status: 'active',
      firingTriggerId: ['utm_trigger_8'],
      blockingTriggerId: [],
      parameter: [
        {
          key: 'event_name',
          value: 'utm_campaign_goal',
        },
        {
          key: 'send_to',
          value: 'G-XXXXXXXXXX',
        },
        {
          key: 'utm_source',
          value: 'email',
        },
        {
          key: 'utm_medium',
          value: 'email',
        },
        {
          key: 'utm_campaign',
          value: '250604_email-engine_maillist',
        },
        {
          key: 'custom_parameter_1',
          value: '홈페이지-엔진 신청',
        },
      ],
      fingerprint: 'utm-goal-8-fingerprint',
      isGoal: true,
      goalPriority: 8,
      category: 'conversion',
      description: 'UTM 캠페인 Goal: 홈페이지-엔진 신청',
      originalUTM: {
        ID: '8',
        관리메모: '홈페이지-엔진 신청',
        랜딩페이지URL: 'https://www.rtm.ai/kr/hubble/engine',
        소스: 'email',
        매체: 'email',
        캠페인: '250604_email-engine_maillist',
        UTM_Content: '',
        UTM_Term: '',
        finalURL:
          'https://www.rtm.ai/kr/hubble/engine?utm_source=email&utm_medium=email&utm_campaign=250604_email-engine_maillist',
        생성일시: '2025-06-25T09:11:39.045Z',
      },
    },
  ]

  // 기존 데모 태그와 UTM Goal 태그 병합
  const mergedTags = [...demoTags, ...goalTags]

  return {
    tags: mergedTags,
    goalTags: goalTags,
    totalGoals: goalTags.length,
  }
}

// 사용 예시:
// const { tags, goalTags } = loadUTMGoals();
// console.log('총 Goal 수:', goalTags.length);
