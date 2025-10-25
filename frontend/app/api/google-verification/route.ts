import { NextResponse } from 'next/server';

export async function GET() {
  const html = `google-site-verification: google635228f3e17c5761.html`;
  
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
