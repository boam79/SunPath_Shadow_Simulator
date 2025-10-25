import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "SunPath & Shadow Simulator | 태양 경로 그림자 시뮬레이터",
    template: "%s | SunPath & Shadow Simulator"
  },
  description: "위치와 날짜를 입력하면 정확한 태양 경로, 일조량, 그림자 방향을 실시간으로 시각화하는 웹 기반 시뮬레이터입니다. 건축, 조경, 태양광 설계에 활용하세요.",
  keywords: [
    "태양 경로",
    "그림자 시뮬레이터", 
    "일조량 계산",
    "태양 위치",
    "건축 설계",
    "조경 설계",
    "태양광",
    "실시간 시뮬레이션",
    "지오코딩",
    "NREL SPA"
  ],
  authors: [{ name: "boam79", email: "ckadltmfxhrxhrxhr@gmail.com" }],
  creator: "boam79",
  publisher: "boam79",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sunpathshadowsimulator.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "SunPath & Shadow Simulator | 태양 경로 그림자 시뮬레이터",
    description: "위치와 날짜로 정확한 태양 경로와 그림자를 실시간 시각화하는 웹 기반 시뮬레이터",
    url: 'https://sunpathshadowsimulator.vercel.app',
    siteName: 'SunPath & Shadow Simulator',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SunPath & Shadow Simulator - 태양 경로와 그림자 시각화',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SunPath & Shadow Simulator | 태양 경로 그림자 시뮬레이터",
    description: "위치와 날짜로 정확한 태양 경로와 그림자를 실시간 시각화하는 웹 기반 시뮬레이터",
    images: ['/og-image.png'],
    creator: '@boam79',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google635228f3e17c5761', // Google Search Console 인증 코드
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
