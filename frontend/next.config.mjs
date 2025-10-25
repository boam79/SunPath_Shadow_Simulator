/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  typescript: {
    // 프로덕션 빌드 시 타입 에러 무시 (선택사항)
    // ignoreBuildErrors: false,
  },
  eslint: {
    // 프로덕션 빌드 시 ESLint 에러 무시 (선택사항)
    // ignoreDuringBuilds: false,
  },
  // SEO 최적화
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  // 정적 파일 서빙 설정
  async rewrites() {
    return [
      {
        source: '/google635228f3e17c5761.html',
        destination: '/google635228f3e17c5761.html',
      },
    ];
  },
  // 헤더 최적화
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
