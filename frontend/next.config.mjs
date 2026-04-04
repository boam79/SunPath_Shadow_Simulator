/** @type {import('next').NextConfig} */
const RENDER_URL = 'https://sunpath-shadow-simulator.onrender.com';

const nextConfig = {
  env: {
    // Vercel에 NEXT_PUBLIC_API_URL이 없으면 Render URL을 기본값으로 사용
    // (클라이언트 번들에 빌드 시 박히는 값이므로 반드시 HTTPS URL이어야 함)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || RENDER_URL,
  },
  // Next.js API Route를 사용하여 프록시하므로 rewrites 불필요
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
