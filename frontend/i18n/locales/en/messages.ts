export default {
  // SEO
  seo: {
    title: 'SunPath & Shadow Simulator | Solar Path Shadow Simulator',
    description: 'Visualize accurate solar path, irradiance, and shadow direction in real-time based on location and date. Perfect for architecture, landscape, and solar panel design.',
    keywords: 'solar path,shadow simulator,irradiance calculator,sun position,architecture design,landscape design,solar energy,real-time simulation,geocoding,NREL SPA',
  },
  // Header
  header: {
    title: 'SunPath & Shadow Simulator',
    subtitle: 'Solar Path · Irradiance · Shadow Simulator',
    openSidebar: 'Open sidebar',
    toggleDark: 'Toggle dark mode',
    apiConnected: 'API Connected',
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
    tabs: {
      single: 'Single',
      batch: 'Batch',
      season: 'Season',
      tools: 'Tools',
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
    clickToSelect: 'Click map to select location',
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
    description: '🌍 Compare solar irradiance across Spring, Summer, Autumn, and Winter.',
    calculating: 'Calculating... (4 seasons)',
    calculateStart: 'Start Season Comparison',
    results: 'Comparison Results',
    maxAltitude: 'Max Solar Altitude',
    dayLength: 'Day Length',
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
};

