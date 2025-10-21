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
};

export default nextConfig;
