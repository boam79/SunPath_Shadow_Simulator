---
description: Render 백엔드 배포 구성 인벤토리
globs: docs/deployment/render_inventory.md
alwaysApply: false
---

## 개요

- **작성일:** 2025-11-10  
- **작성자:** Executor (Task 16)  
- **목적:** Render 기반 FastAPI 백엔드 배포 구성을 정리하여 AWS 이전 시 누락/회귀를 방지

## 1. 서비스 메타데이터

- **서비스 이름:** `sunpath-api` (Render Web Service)
- **배포 대상:** FastAPI 백엔드 (`backend` 디렉터리)
- **빌드 타입:** Render Web Service (Python 환경)
- **Git 연동:** GitHub 저장소 `https://github.com/boam79/SunPath_Shadow_Simulator` (브랜치 `master`, Auto-Deploy = On Commit)
- **Deploy Hook:** `https://api.render.com/deploy/srv-d3rmldp5pdvs73tqfd8g?key=...` *(비공개 URL, 키 확인 필요 시 Render에서 재발급)*
- **현재 프로덕션 URL:** `https://sunpath-api.onrender.com`
- **헬스체크 엔드포인트:** `GET /health` (200 응답 시 정상)
- **리전:** Singapore (Southeast Asia)
- **인스턴스 타입:** Free (0.1 vCPU / 512 MB RAM)
- **연관 서비스:** Render Key Value (Redis) 인스턴스 `sunpath_redis`

> 📌 **확인 필요:** Render 대시보드에서 사용 중인 브랜치, 리전, 인스턴스 스펙(메모리/CPU), 헬스체크 주기. 사용자 확인 후 아래에 업데이트해주세요.

## 2. 빌드 & 실행 설정

- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Python 버전:** Render Python 3.x (repo에서는 3.11-slim Docker 이미지를 사용)
- **런타임 의존성:**
  - 시스템 패키지: `gcc` (Dockerfile.dev 기준)
  - 파이썬 패키지: `fastapi`, `uvicorn[standard]`, `pydantic`, `pvlib`, `numpy`, `pandas`, `redis`, `python-dotenv`, `httpx`
- **로그 출력:** STDOUT/STDERR (Render Dashboard → Logs)

## 2-1. Redis(Key Value) 인스턴스 메타데이터

- **이름:** `sunpath_redis`
- **상태:** Available
- **리전:** Singapore (Southeast Asia)
- **인스턴스 타입:** Free (25 MB RAM / 50 connection limit)
- **Maxmemory Policy:** `allkeys-lru`
- **내부 연결 URL:** `redis://red-d3rluoc9c44c73aqq02u0:6379`
- **외부 연결:** 기본 차단 (Valkey Inbound IP Rules 비활성)
- **인증:** Internal Authentication disabled (기본값)

> 📌 AWS 전환 시 동일 리전에 ElastiCache 또는 자체 Redis를 구성하고 보안 그룹을 통해 접근을 제어해야 합니다.

## 3. 환경 변수 / 시크릿

| 키 | 용도 | 현재 값 | 이전 대상 |
| --- | --- | --- | --- |
| `ALLOWED_ORIGINS` | CORS 허용 도메인 (쉼표 구분) | 운영값: `https://sunpathshadowsimulator.vercel.app` (추가 도메인 확인 필요) | AWS Parameter Store 또는 Secrets Manager |
| `REDIS_URL` | Render Redis 연결 문자열 | `redis://red-d3rluoc9c44c73aqq02u0:6379` | AWS ElastiCache 접속 정보 또는 외부 Redis URL |
| `REDIS_HOST`/`REDIS_PORT` | 로컬 개발용 (docker-compose) | 기본값 `redis`, `6379` | 필요 시 .env 파일 유지 |
| `REDIS_CACHE_TTL` | 캐시 TTL (기본 21600초) | 옵션 값, 미설정 시 기본값 사용 | 환경 변수/설정 파일 |
| `BACKEND_CORS_ORIGINS` | 기본 CORS 허용 목록 (설정 클래스) | `.env` 로 오버라이드 가능 | 동일 |

> ⚠️ **주의:** 실제 운영값은 Render에서 직접 확인 후 안전한 경로(예: 1Password, AWS Secrets Manager)에 이관하세요. 코멘트에 직접 기입하지 마십시오.

## 4. 네트워킹 & 의존성

- **외부 통신:**
  - Vercel 프론트엔드 (`NEXT_PUBLIC_API_URL` → Render API)
  - OpenStreetMap/Nominatim (지오코딩 API)
- **내부 통신:** Render Redis 인스턴스 (`REDIS_URL`)
- **포트:** FastAPI 기본 포트 `8000` (Render는 `$PORT` 환경 변수로 지정)
- **SSL/TLS:** Render에서 자동 HTTPS 지원 (커스텀 도메인 미사용)

## 5. 모니터링 & 알림 (현재 상태)

- **로그 확인:** Render Dashboard → Logs
- **자동 알림:** README 상 언급 없음 (알림 설정 불명)
- **헬스체크:** `/health` 엔드포인트 (수동 확인)

> ✅ AWS 이전 시 CloudWatch Logs/Alarms, 헬스체크(ELB/Route53) 도입 권장.

## 6. 배포 파이프라인 현황

- **현재:** Render 자동 배포 (GitHub `master` 브랜치 push 시 재배포)
- **수동 재배포:** Render Dashboard → Manual Deploy
- **Deploy Hook:** Render가 발급한 전용 URL 사용 가능
- **배포 실패 기록:** README에 과거 502 오류가 있었으며 수동 재배포로 해결

## 7. 마이그레이션 TODO (AWS)

1. Render 대시보드에서 브랜치/리전/인스턴스 스펙, 환경 변수 실제 값 확인  
2. 환경 변수/시크릿을 AWS Secrets Manager 또는 Parameter Store로 이전  
3. Redis 대체 방안 결정 (AWS ElastiCache 또는 자체 호스팅)  
4. GitHub Actions 기반 CI/CD 파이프라인 설계 (Task 18)  
5. DNS/SSL 전환 및 모니터링 구성 (Task 19)

---

필요한 추가 정보(예: 실제 환경 변수 값, Render Redis 내부 URL)는 사용자 또는 운영 담당자가 수집 후 문서에 업데이트해주세요. 업데이트 시 변경 이력과 날짜를 명시하면 추적에 용이합니다.

