/**
 * API Proxy Route
 * Vercel 환경에서 HTTP 백엔드로의 요청을 프록시하여 Mixed Content 문제를 해결
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'DELETE');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'OPTIONS');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 경로 구성 (예: ['api', 'integrated', 'calculate'] -> 'api/integrated/calculate')
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    // 백엔드 URL 구성 (예: http://54.180.251.93/api/integrated/calculate)
    const targetUrl = `${BACKEND_URL}/${path}${queryString}`;
    
    console.log(`[API Proxy] ${method} ${path} -> ${targetUrl}`);

    // 요청 본문 가져오기
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    // 백엔드로 요청 전달
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Origin': request.headers.get('Origin') || '',
        'Referer': request.headers.get('Referer') || '',
      },
      body: body,
    });

    // 응답 데이터 가져오기
    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // CORS 헤더 추가
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Credentials', 'true');
    
    // 원본 응답 헤더 복사
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        headers.set(key, value);
      }
    });

    return NextResponse.json(jsonData, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

