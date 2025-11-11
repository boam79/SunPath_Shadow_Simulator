# Mixed Content 문제 해결

## 문제 상황

프론트엔드(Vercel, HTTPS)에서 백엔드(AWS EC2, HTTP)로 API 요청 시 "Failed to fetch" 오류 발생.

## 원인

**Mixed Content 문제**: HTTPS 페이지에서 HTTP 리소스를 로드하려고 할 때 브라우저가 보안상의 이유로 차단합니다.

- 프론트엔드: `https://sunpathshadowsimulator.vercel.app` (HTTPS)
- 백엔드: `http://54.180.251.93` (HTTP)
- 브라우저가 HTTPS → HTTP 요청을 차단

## 해결 방법

Next.js API Route를 사용하여 프록시를 구현했습니다.

### 1. API 프록시 Route 생성

`frontend/app/api/proxy/[...path]/route.ts` 파일을 생성하여 모든 HTTP 메서드를 프록시합니다.

### 2. 프론트엔드 API 클라이언트 수정

`frontend/lib/api.ts`에서 Vercel 환경이고 HTTP 백엔드를 사용하는 경우 자동으로 프록시 경로(`/api/proxy`)를 사용하도록 수정했습니다.

### 작동 방식

1. 프론트엔드에서 API 요청: `/api/proxy/api/integrated/calculate`
2. Next.js API Route가 요청을 받음
3. API Route가 백엔드로 요청 전달: `http://54.180.251.93/api/integrated/calculate`
4. 백엔드 응답을 받아서 프론트엔드로 전달
5. 모든 통신이 HTTPS로 이루어짐 (Mixed Content 문제 해결)

## 테스트

### 로컬 테스트
```bash
cd frontend
npm run dev
# 브라우저에서 http://localhost:3000 접속
# 개발자 도구 → Network 탭에서 API 요청 확인
```

### 배포 후 테스트
1. Vercel에 배포
2. 브라우저에서 프론트엔드 접속
3. 개발자 도구 → Network 탭에서 API 요청 확인
4. `/api/proxy/...` 경로로 요청이 가는지 확인

## 대안 해결 방법

### 옵션 1: SSL 인증서 설정 (권장, 장기적)
- 도메인 구매/설정
- Let's Encrypt로 SSL 인증서 발급
- 백엔드를 HTTPS로 제공
- 프록시 불필요

### 옵션 2: 현재 구현 (프록시)
- 즉시 사용 가능
- 추가 비용 없음
- 도메인 불필요
- Vercel 서버를 통한 추가 홉 발생 (약간의 지연)

## 참고

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content)

