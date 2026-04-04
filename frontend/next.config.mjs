/** @type {import('next').NextConfig} */
const RENDER_URL = 'https://sunpath-shadow-simulator.onrender.com';

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || RENDER_URL,
  },

  // Next.js 빌트인 rewrite: 브라우저 → /api/backend/* → Render (서버사이드 프록시)
  // 커스텀 API Route 없이 Vercel 인프라가 직접 처리 → CORS/OPTIONS 문제 없음
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || RENDER_URL;
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
