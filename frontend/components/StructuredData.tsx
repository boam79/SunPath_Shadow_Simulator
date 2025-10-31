import Script from 'next/script'

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "SunPath & Shadow Simulator",
    "description": "위치와 날짜를 입력하면 정확한 태양 경로, 일조량, 그림자 방향을 실시간으로 시각화하는 웹 기반 시뮬레이터",
    "url": "https://sunpathshadowsimulator.vercel.app",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "author": {
      "@type": "Person",
      "name": "boam79",
      "email": "ckadltmfxhrxhrxhr@gmail.com"
    },
    "creator": {
      "@type": "Person", 
      "name": "boam79"
    },
    "keywords": [
      "태양 경로",
      "그림자 시뮬레이터",
      "일조량 계산", 
      "태양 위치",
      "건축 설계",
      "조경 설계",
      "태양광",
      "실시간 시뮬레이션",
      "solar path",
      "shadow length",
      "solar irradiance",
      "sun altitude azimuth"
    ],
    "featureList": [
      "실시간 태양 경로 시각화",
      "정확한 그림자 방향 및 길이 계산",
      "일조량 분석 (GHI, DNI, DHI)",
      "지오코딩 기반 위치 검색",
      "타임라인 애니메이션",
      "데이터 내보내기 (CSV/JSON)"
    ],
    "screenshot": "https://sunpathshadowsimulator.vercel.app/og-image.png",
    "inLanguage": "ko-KR",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://sunpathshadowsimulator.vercel.app/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "1.0.0",
    "datePublished": "2025-01-21",
    "dateModified": new Date().toISOString().split('T')[0]
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}
