export default {
  // SEO
  seo: {
    title: 'SunPath & Shadow Simulator | 태양 경로 그림자 시뮬레이터',
    description: '위치와 날짜를 입력하면 정확한 태양 경로, 일조량, 그림자 방향을 실시간으로 시각화하는 웹 기반 시뮬레이터입니다. 건축, 조경, 태양광 설계에 활용하세요.',
    keywords: '태양 경로,그림자 시뮬레이터,일조량 계산,태양 위치,건축 설계,조경 설계,태양광,실시간 시뮬레이션,지오코딩,NREL SPA',
  },
  // Header
  nav: {
    aria: '주요 메뉴',
    map: '지도',
    data: '그래프',
    more: '설정',
    closeSheet: '닫기',
  },

  main: {
    dataWaiting: '지도 탭에서 위치를 정하면 이곳에 그래프와 수치가 나타나요.',
    dataLoading: '데이터를 불러오는 중이에요…',
  },

  onboarding: {
    kicker: '처음이신가요?',
    title: '이렇게 쓰면 돼요',
    step1: '주소를 검색하거나 지도를 눌러 위치를 정해요.',
    step2: '날짜와 시간을 바꾸면 해와 그림자가 같이 움직여요.',
    step3: '「그래프」에서 수치와 차트를, 「설정」에서 물체 높이·보내기·고급 기능을 쓸 수 있어요.',
    cta: '알겠어요, 시작할게요',
  },

  header: {
    title: 'SunPath & Shadow',
    subtitle: '위치만 정하면, 오늘의 해와 그림자가 쉽게 보여요',
    openSidebar: '사이드바 열기',
    toggleDark: '다크모드 토글',
    selectLanguage: '언어 선택',
    apiConnected: '연결 좋아요',
    apiChecking: '잠깐 확인 중…',
    apiSlow: '첫 연결은 조금 느릴 수 있어요',
    apiError: '연결에 문제가 있어요',
    apiRecheck: 'API 상태 다시 확인',
  },

  // Sidebar
  sidebar: {
    location: '위치',
    addressSearch: '주소 검색 (예: 서울특별시 중구)',
    addressSearchPlaceholder: '주소 검색',
    latitude: '위도 (Latitude)',
    longitude: '경도 (Longitude)',
    useCurrentLocation: '현재 위치 사용',
    gettingLocation: '위치 가져오는 중...',
    quickLocations: {
      seoul: '서울',
      busan: '부산',
      jeju: '제주',
    },
    date: '날짜',
    quickDates: {
      today: '오늘',
      solstice: '하지 (6/21)',
      winter: '동지 (12/21)',
      spring: '춘분 (3/20)',
    },
    timeline: '타임라인',
    objectHeight: '물체 높이',
    time: '시각',
    currentSettings: '현재 설정',
    locationLabel: '위치',
    dateLabel: '날짜',
    timeLabel: '시각',
    heightLabel: '높이',
    exportTitle: '데이터 내보내기',
    exportCSV: 'CSV',
    exportJSON: 'JSON',
    exportSummary: '요약',
    exportCopy: '복사',
    exportCopied: '복사됨!',
    dataPoints: '개 데이터 포인트',
    weatherTitle: '기상 요약 (Open-Meteo)',
    weatherAvgCloud: '일 평균 운량',
    weatherAtTime: '선택 시각 운량',
    weatherPrecip: '강수 확률',
    compareToggle: '두 물체 높이 비교',
    compareHeight: '비교 물체 높이 (m)',
    compareTableTitle: '그림자 최대 길이 비교 (m)',
    compareColA: '기준 높이',
    compareColB: '비교 높이',
    printReport: '요약 인쇄 / PDF',
    lastSavedHint: '마지막 계산 요약이 이 기기에 저장되었습니다.',
    tabs: {
      single: '하루 보기',
      batch: '여러 번',
      season: '계절 비교',
      tools: '더보기',
    },
  },

  // Donation
  donation: {
    title: '카카오페이로 후원하기',
    desktopHint: 'QR 코드 표시',
  },

  // Footer
  footer: {
    copyright: '© 2025 SunPath & Shadow Simulator',
    createdBy: '제작자',
    contact: '문의사항',
    shareLink: '이 화면 공유하기',
    shareCopied: '링크를 복사했어요!',
  },

  loading: {
    coldStart:
      '첫 실행이라 서버가 잠에서 깨는 중이에요. ({{seconds}}초째 — 보통 1분 안쪽이면 돼요)',
  },

  // Map
  map: {
    location: '위치',
    solarAltitude: '태양 고도',
    shadowLength: '그림자 길이',
    irradiance: '일사량',
    coordinates: '좌표',
    address: '주소',
    sun: '태양',
    shadow: '그림자',
    altitude: '고도',
    direction: '방위',
    infinite: '무한대',
    legend: '범례',
    referencePoint: '기준점 (위치)',
    sunPosition: '태양 위치',
    currentShadow: '현재 그림자',
    shadowTrajectory: '하루 그림자 궤적',
    clickToSelect: '지도를 눌러 위치를 바꿀 수 있어요',
  },

  // Chart
  chart: {
    solarAltitude: '태양 고도',
    azimuth: '방위각',
    irradiance: '일사량 (W/m²)',
    shadowLength: '그림자 길이 (m)',
    time: '시간',
    altitudeAzimuth: '태양 고도 및 방위각',
    altitude: '고도',
    ghiArea: '일사량 (누적 영역)',
    shadowVariation: '그림자 길이 변화',
    current: '현재',
    length: '길이',
    ghi: 'GHI',
    dni: 'DNI',
    dhi: 'DHI',
  },

  // Optimization
  optimization: {
    optimalSunHours: '최적 일조 시간',
    maxSolarAltitude: '최대 태양 고도',
    dailyTotalIrradiance: '일일 총 일사량',
    sunriseSunset: '일출/일몰',
    sunrise: '일출',
    sunset: '일몰',
    retry: '다시 시도',
    analysis: '최적화 분석 중...',
    recommendations: '최적 시간대 추천',
    maxIrradiance: '최대 일사량 시간',
    minShadow: '최소 그림자 시간',
    optimalCollection: '최적 태양광 수집 시간대',
    shadowInterference: '그림자 간섭 시간대',
    altitudeUnit: '고도',
    hours: '시간',
    average: '평균',
    at: '·',
  },

  // Timeline
  timeline: {
    play: '재생',
    pause: '일시정지',
    currentTime: '현재 시각',
    playbackSpeed: '재생 속도',
    first: '처음으로',
    hourBack: '1시간 뒤로',
    hourForward: '1시간 앞으로',
    last: '마지막으로',
  },

  // Errors
  errors: {
    locationNotSupported: '이 브라우저는 위치 정보를 지원하지 않습니다.',
    invalidLocation: '가져온 위치 값이 올바르지 않습니다. 다시 시도해 주세요.',
    invalidLocationRange: '가져온 위치 범위가 유효하지 않습니다.',
    locationDenied: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.',
    locationUnavailable: '위치 정보를 사용할 수 없습니다.',
    locationTimeout: '위치 요청 시간이 초과되었습니다.',
    locationFailed: '위치를 가져올 수 없습니다.',
    loadDataError: '데이터를 불러오는 중 오류가 발생했습니다',
  },

  // Donation Modal
  donationModal: {
    title: '카카오페이 후원',
    instruction: '모바일 카카오페이 앱에서\nQR 코드를 스캔해주세요',
    openLink: '링크로 열기',
  },

  // Batch Calculator
  batchCalculator: {
    title: '배치 계산',
    add: '추가',
    location: '위치',
    latitude: '위도',
    longitude: '경도',
    date: '날짜',
    height: '높이 (m)',
    parallelProcessing: '병렬 처리 (빠름)',
    calculating: '계산 중...',
    calculateStart: '계산 시작',
    locations: '개',
    remove: '삭제',
    addRequest: '요청 추가',
    errorTitle: '계산 실패',
    errorMessage: '배치 계산 중 오류가 발생했습니다',
    noResults: '결과가 없습니다',
    requestLabel: '위치',
  },

  // Advanced Options
  advancedOptions: {
    title: '고급 옵션',
    skyModelLabel: '하늘 모델 (Sky Diffuse Model)',
    skyModelDescription: 'POA 계산시 사용. Perez 모델 권장.',
    skyModels: {
      isotropic: 'Isotropic (등방성)',
      perez: 'Perez (고정밀) ✅',
      klucher: 'Klucher',
    },
    intervalLabel: '시간 간격',
    intervalMin: '분',
    intervalDescription: '📊 데이터 포인트 간격. 작을수록 정밀하지만 계산 시간 증가.',
    intervalLabels: {
      min: '10분',
      mid: '60분',
      max: '120분',
    },
    unitsLabel: '측정 단위',
    unitsMetric: '미터법 (m, km)',
    unitsImperial: '야드법 (ft, mi)',
    unitsDescription: '📏 거리, 높이, 그림자 길이 표시 단위 선택.',
    tips: {
      title: '💡 고급 옵션 사용 팁:',
      precision: '정밀 분석: Perez 모델 + 10분 간격',
      standard: '일반 분석: Isotropic 모델 + 60분 간격',
      quick: '빠른 분석: Isotropic 모델 + 120분 간격',
    },
  },

  // Preset Manager
  presetManager: {
    open: '프리셋 열기',
    save: '저장',
    nameLabel: '프리셋 이름',
    namePlaceholder: '예: 서울 태양광 설계',
    saveButton: '저장',
    cancelButton: '취소',
    deleteConfirm: '프리셋을 삭제하시겠습니까?',
    noPresets: '저장된 프리셋이 없습니다',
    favoritePresets: '즐겨찾기',
    regularPresets: '일반 프리셋',
    createdAt: '생성일',
  },

  // Season Comparison
  seasonComparison: {
    title: '계절별 비교',
    description: '🌍 춘분, 하지, 추분, 동지의 일조량을 한 번에 비교합니다.',
    calculating: '계산 중... (4개 계절)',
    calculateStart: '계절 비교 시작',
    results: '비교 결과',
    maxAltitude: '최대 태양 고도',
    dayLength: '일조 시간',
    seasons: {
      spring: '봄',
      summer: '여름',
      autumn: '가을',
      winter: '겨울',
    },
    seasonEmojis: {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️',
    },
  },
};

