export default {
  // SEO
  seo: {
    title: 'SunPath & Shadow Simulator | Solar Path Shadow Simulator',
    description: 'Visualize accurate solar path, irradiance, and shadow direction in real-time based on location and date. Perfect for architecture, landscape, and solar panel design.',
    keywords: 'solar path,shadow simulator,irradiance calculator,sun position,architecture design,landscape design,solar energy,real-time simulation,geocoding,NREL SPA',
  },
  // Header
  nav: {
    aria: 'Main navigation',
    map: 'Map',
    data: 'Charts',
    more: 'Settings',
    closeSheet: 'Close',
  },

  main: {
    dataWaiting: 'Pick a spot on the Map tab — charts and numbers will show up here.',
    dataLoading: 'Loading your data…',
    expandAnalytics: 'Show charts & analysis',
    collapseAnalytics: 'Map only',
  },

  onboarding: {
    kicker: 'New here?',
    title: 'How it works',
    step1: 'Search for a place or tap the map to set your spot.',
    step2: 'Change the date and time — the sun and shadow move with you.',
    step3: 'Use Charts for numbers and graphs; use Settings for height, export, and extras.',
    cta: 'Got it, let’s go',
  },

  header: {
    title: 'SunPath & Shadow',
    subtitle: 'See the sun move — shadows in real time',
    openSidebar: 'Open sidebar',
    toggleDark: 'Toggle dark mode',
    selectLanguage: 'Select language',
    apiConnected: 'All good',
    apiChecking: 'Checking…',
    apiSlow: 'Warming up (first load can be slow)',
    apiError: 'Can’t reach the server',
    apiRecheck: 'Recheck API status',
  },

  // Sidebar
  sidebar: {
    location: 'Location',
    addressSearch: 'Search address (e.g., Seoul, South Korea)',
    addressSearchPlaceholder: 'Search address',
    latitude: 'Latitude',
    longitude: 'Longitude',
    useCurrentLocation: 'Use Current Location',
    gettingLocation: 'Getting location...',
    quickLocations: {
      seoul: 'Seoul',
      busan: 'Busan',
      jeju: 'Jeju',
    },
    date: 'Date',
    quickDates: {
      today: 'Today',
      solstice: 'Solstice (6/21)',
      winter: 'Winter (12/21)',
      spring: 'Spring (3/20)',
    },
    timeline: 'Timeline',
    objectHeight: 'Object Height',
    time: 'Time',
    currentSettings: 'Current Settings',
    locationLabel: 'Location',
    dateLabel: 'Date',
    timeLabel: 'Time',
    heightLabel: 'Height',
    exportTitle: 'Export Data',
    exportCSV: 'CSV',
    exportJSON: 'JSON',
    exportSummary: 'Summary',
    exportCopy: 'Copy',
    exportCopied: 'Copied!',
    dataPoints: ' data points',
    weatherTitle: 'Weather (Open-Meteo)',
    weatherAvgCloud: 'Daily avg cloud cover',
    weatherAtTime: 'Cloud at selected time',
    weatherPrecip: 'Precipitation probability',
    compareToggle: 'Compare two object heights',
    compareHeight: 'Comparison height (m)',
    compareTableTitle: 'Max shadow length (m)',
    compareColA: 'Primary',
    compareColB: 'Comparison',
    printReport: 'Print summary / PDF',
    lastSavedHint: 'Last calculation summary saved on this device.',
    coordsToggle: 'Enter coordinates',
    tabsAria: 'Sidebar modes',
    tabs: {
      simulate: 'Simulate',
      compare: 'Compare',
      tools: 'Tools',
      single: 'Simulate',
      batch: 'Many dates',
      season: 'Seasons',
      toolsLegacy: 'Tools',
    },
  },

  // Donation
  donation: {
    title: 'Donate via KakaoPay',
    desktopHint: 'Show QR Code',
  },

  // Footer
  footer: {
    copyright: '© 2025 SunPath & Shadow Simulator',
    createdBy: 'Created by',
    contact: 'Contact',
    shareLink: 'Share this view',
    shareCopied: 'Link copied!',
  },

  loading: {
    coldStart:
      'The server is waking up — first visit can take a bit. ({{seconds}}s — usually under a minute)',
  },

  // Map
  map: {
    location: 'Location',
    solarAltitude: 'Solar Altitude',
    shadowLength: 'Shadow Length',
    irradiance: 'Irradiance',
    coordinates: 'Coordinates',
    address: 'Address',
    sun: 'Sun',
    shadow: 'Shadow',
    altitude: 'Altitude',
    direction: 'Direction',
    infinite: 'Infinite',
    legend: 'Legend',
    referencePoint: 'Reference Point (Location)',
    sunPosition: 'Sun Position',
    currentShadow: 'Current Shadow',
    shadowTrajectory: 'Daily Shadow Trajectory',
    clickToSelect: 'Tap the map to pick a spot',
  },

  // Chart
  chart: {
    solarAltitude: 'Solar Altitude',
    azimuth: 'Azimuth',
    irradiance: 'Irradiance (W/m²)',
    shadowLength: 'Shadow Length (m)',
    time: 'Time',
    altitudeAzimuth: 'Solar Altitude & Azimuth',
    altitude: 'Altitude',
    ghiArea: 'Irradiance (Cumulative Area)',
    shadowVariation: 'Shadow Length Variation',
    current: 'Current',
    length: 'Length',
    ghi: 'GHI',
    dni: 'DNI',
    dhi: 'DHI',
    poa: 'POA',
    par: 'PAR',
    weatherGhi: 'Weather SW',
    showPar: 'Show PAR',
    showWeather: 'Show weather correction',
    showPoa: 'Show POA',
  },

  // Optimization
  optimization: {
    optimalSunHours: 'Optimal Sunlight Hours',
    maxSolarAltitude: 'Maximum Solar Altitude',
    dailyTotalIrradiance: 'Daily Total Irradiance',
    sunriseSunset: 'Sunrise/Sunset',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    retry: 'Retry',
    analysis: 'Analyzing optimization...',
    recommendations: 'Recommended Time Periods',
    maxIrradiance: 'Maximum Irradiance Time',
    minShadow: 'Minimum Shadow Time',
    optimalCollection: 'Optimal Solar Collection Periods',
    shadowInterference: 'Shadow Interference Periods',
    altitudeUnit: 'Altitude',
    hours: 'hours',
    average: 'avg',
    at: 'at',
  },

  // Timeline
  timeline: {
    play: 'Play',
    pause: 'Pause',
    currentTime: 'Current Time',
    playbackSpeed: 'Playback Speed',
    first: 'First',
    hourBack: '1 Hour Back',
    hourForward: '1 Hour Forward',
    last: 'Last',
    tipAltitude: 'Altitude',
    tipGhi: 'GHI',
    tipShadow: 'Shadow',
  },

  // Errors
  errors: {
    locationNotSupported: 'This browser does not support location information.',
    invalidLocation: 'Invalid location value. Please try again.',
    invalidLocationRange: 'Invalid location range.',
    locationDenied: 'Location permission denied. Please allow location access in your browser settings.',
    locationUnavailable: 'Location information is unavailable.',
    locationTimeout: 'Location request timed out.',
    locationFailed: 'Unable to retrieve location.',
    loadDataError: 'Error loading data',
  },

  // Donation Modal
  donationModal: {
    title: 'KakaoPay Donation',
    instruction: 'Scan QR code with\nmobile KakaoPay app',
    openLink: 'Open link',
  },

  // Batch Calculator
  batchCalculator: {
    title: 'Batch Calculator',
    add: 'Add',
    location: 'Location',
    latitude: 'Latitude',
    longitude: 'Longitude',
    date: 'Date',
    height: 'Height (m)',
    parallelProcessing: 'Parallel Processing (Fast)',
    calculating: 'Calculating...',
    calculateStart: 'Start Calculation',
    locations: '',
    remove: 'Remove',
    addRequest: 'Add Request',
    errorTitle: 'Calculation Failed',
    errorMessage: 'An error occurred during batch calculation',
    noResults: 'No results',
    requestLabel: 'Location',
  },

  // Advanced Options
  advancedOptions: {
    title: 'Advanced Options',
    skyModelLabel: 'Sky Diffuse Model',
    skyModelDescription: 'Used for POA calculations. Perez model recommended.',
    skyModels: {
      isotropic: 'Isotropic',
      perez: 'Perez (High Precision) ✅',
      klucher: 'Klucher',
    },
    intervalLabel: 'Time Interval',
    intervalMin: ' min',
    intervalDescription: '📊 Data point spacing. Smaller = more precise but longer calculation time.',
    intervalLabels: {
      min: '10 min',
      mid: '60 min',
      max: '120 min',
    },
    unitsLabel: 'Units',
    unitsMetric: 'Metric (m, km)',
    unitsImperial: 'Imperial (ft, mi)',
    unitsDescription: '📏 Display units for distance, height, and shadow length.',
    tips: {
      title: '💡 Advanced Options Tips:',
      precision: 'Precision: Perez model + 10 min interval',
      standard: 'Standard: Isotropic model + 60 min interval',
      quick: 'Quick: Isotropic model + 120 min interval',
    },
  },

  // Preset Manager
  presetManager: {
    open: 'Open Presets',
    save: 'Save',
    nameLabel: 'Preset Name',
    namePlaceholder: 'e.g., Seoul Solar Design',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    deleteConfirm: 'Delete this preset?',
    noPresets: 'No saved presets',
    favoritePresets: 'Favorites',
    regularPresets: 'Presets',
    createdAt: 'Created',
  },

  // Season Comparison
  seasonComparison: {
    title: 'Season Comparison',
    description: 'Compare day length, altitude, irradiance, and shadow across equinoxes and solstices.',
    calculating: 'Calculating... (4 seasons)',
    calculateStart: 'Start Season Comparison',
    results: 'Comparison Results',
    maxAltitude: 'Max Solar Altitude',
    dayLength: 'Day Length',
    totalGhi: 'Total irradiance (kWh/m²)',
    maxGhi: 'Max GHI (W/m²)',
    minShadow: 'Min shadow (m)',
    seasons: {
      spring: 'Spring',
      summer: 'Summer',
      autumn: 'Autumn',
      winter: 'Winter',
    },
    seasonEmojis: {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️',
    },
  },

  summary: {
    aria: 'Daily sun and irradiance summary',
    sunrise: 'Sunrise',
    solarNoon: 'Solar noon',
    sunset: 'Sunset',
    dayLength: 'Day length',
    maxAltitude: 'Max altitude',
    totalIrradiance: 'Total GHI',
    hoursSuffix: 'h',
  },

  mapLegend: {
    sunPath: 'Sun path',
    shadowTip: 'Shadow tip trail',
    shadowPoly: 'Shadow area',
  },

  map3d: {
    controlsAria: 'Map 3D settings',
    terrain: 'Terrain',
    buildings: 'Buildings',
    sunColumn: 'Sun height',
    raycast: 'Building raycast',
    siteShaded: 'Occluded — site in building shade',
    shadowClipped: 'Object shadow clipped by building',
    buildingShadows: 'Nearby building shadows',
    freeShadow: 'Unobstructed shadow',
    resetView: 'Frame view',
  },

  panelTilt: {
    title: 'Panel tilt (POA)',
    tilt: 'Tilt',
    azimuth: 'Panel azimuth',
    hint: 'Tilt above 0° enables POA irradiance.',
  },
};

