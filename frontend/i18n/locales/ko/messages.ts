export default {
  // Header
  header: {
    title: 'SunPath & Shadow Simulator',
    subtitle: '태양 경로 · 일조량 · 그림자 시뮬레이터',
    openSidebar: '사이드바 열기',
    toggleDark: '다크모드 토글',
    apiConnected: 'API 연결됨',
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
  },

  // Map
  map: {
    location: '위치',
    solarAltitude: '태양 고도',
    shadowLength: '그림자 길이',
    irradiance: '일사량',
  },

  // Chart
  chart: {
    solarAltitude: '태양 고도',
    azimuth: '방위각',
    irradiance: '일사량 (W/m²)',
    shadowLength: '그림자 길이 (m)',
    time: '시간',
  },

  // Optimization
  optimization: {
    optimalSunHours: '최적 일조 시간',
    maxSolarAltitude: '최대 태양 고도',
    dailyTotalIrradiance: '일일 총 일사량',
    sunriseSunset: '일출/일몰',
  },

  // Timeline
  timeline: {
    play: '재생',
    pause: '일시정지',
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
};

