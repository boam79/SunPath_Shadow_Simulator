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
};

