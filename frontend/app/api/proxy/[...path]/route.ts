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
  // 타임아웃 설정 (60초 - Vercel 최대 제한)
  const TIMEOUT_MS = 60000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

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

    // 백엔드로 요청 전달 (타임아웃 포함)
    const startTime = Date.now();
    let response: Response;
    
    try {
      response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
          'Origin': request.headers.get('Origin') || '',
          'Referer': request.headers.get('Referer') || '',
        },
        body: body,
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // 타임아웃 에러 처리
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[API Proxy] Timeout after ${TIMEOUT_MS}ms: ${targetUrl}`);
        return NextResponse.json(
          { 
            error: 'Request timeout', 
            message: '백엔드 서버 응답이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
            detail: `요청이 ${TIMEOUT_MS / 1000}초 내에 완료되지 않았습니다.`
          },
          { status: 504 }
        );
      }
      
      // 네트워크 에러 처리
      console.error('[API Proxy] Network error:', fetchError);
      return NextResponse.json(
        { 
          error: 'Network error', 
          message: '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
          detail: fetchError instanceof Error ? fetchError.message : 'Unknown network error'
        },
        { status: 503 }
      );
    }
    
    clearTimeout(timeoutId);
    const elapsedTime = Date.now() - startTime;
    console.log(`[API Proxy] ${method} ${path} completed in ${elapsedTime}ms`);

    // 응답 데이터 가져오기
    let data: string;
    try {
      data = await response.text();
    } catch (readError) {
      console.error('[API Proxy] Failed to read response:', readError);
      return NextResponse.json(
        { 
          error: 'Response read error', 
          message: '백엔드 서버 응답을 읽을 수 없습니다.'
        },
        { status: 502 }
      );
    }

    let jsonData: unknown;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // 504 Gateway Timeout 에러 처리
    if (response.status === 504) {
      console.error(`[API Proxy] Backend returned 504: ${targetUrl}`);
      return NextResponse.json(
        { 
          error: 'Gateway timeout', 
          message: '백엔드 서버가 응답하는 데 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
          detail: '백엔드 서버의 타임아웃 제한에 걸렸을 수 있습니다.'
        },
        { status: 504 }
      );
    }

    // 5xx 서버 에러 처리
    if (response.status >= 500) {
      console.error(`[API Proxy] Backend server error ${response.status}: ${targetUrl}`);
      return NextResponse.json(
        { 
          error: 'Backend server error', 
          message: '백엔드 서버에서 오류가 발생했습니다.',
          detail: typeof jsonData === 'object' && jsonData !== null && 'detail' in jsonData 
            ? String(jsonData.detail) 
            : `Server returned status ${response.status}`
        },
        { status: response.status }
      );
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
    clearTimeout(timeoutId);
    console.error('[API Proxy] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Proxy request failed', 
        message: '프록시 요청 중 예기치 않은 오류가 발생했습니다.',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

