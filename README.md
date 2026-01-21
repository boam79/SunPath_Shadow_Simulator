# 🌞 SunPath & Shadow Simulator

웹 기반 태양 경로, 일조량, 그림자 실시간 시뮬레이터

## 📋 프로젝트 개요

위치와 날짜를 입력하면 해당 위치의 일조량, 태양의 움직임, 그림자 방향 및 길이를 실시간으로 시각화하는 시뮬레이터입니다.

### 주요 기능
- 🗺️ 주소 기반 위치 검색 (지오코딩)
- ☀️ 고정밀 태양 경로 계산 (NREL SPA 알고리즘)
- 🌗 실시간 그림자 시뮬레이션
- 📊 일사량 계산 (GHI/DNI/DHI) - ✅ v0.1.1 정확도 개선
- 🎬 타임라인 애니메이션 (30fps) - ✅ v0.1.1 성능 최적화
- 📥 데이터 내보내기 (CSV/JSON)
- 📊 고급 차트 시각화 (Recharts) - ✅ v0.1.6 추가
- ⚡ 최적 시간대 추천 분석 - ✅ v0.1.6 추가
- 🎨 시간 기반 컬러 그라데이션 - ✅ v0.1.6 추가
- 🌐 다국어 지원 (한국어/영어) - ✅ v0.1.7 추가

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** - App Router, TypeScript
- **Tailwind CSS** - 스타일링
- **MapLibre GL JS** - 지도 표시
- **Recharts** - 차트 시각화
- **Custom i18n** - 다국어 지원 (React Context API)

### Backend
- **FastAPI** - Python API 서버
- **pvlib-python** - 태양 위치 계산
- **Redis** - 캐싱 레이어
- **Pydantic** - 데이터 검증

### Infrastructure
- **Docker** - 컨테이너화
- **Docker Compose** - 로컬 개발 환경
- **Render** - 백엔드 프로덕션 서버 (v0.1.13+) 🆕
- **Vercel** - 프론트엔드 호스팅

### 프로덕션 URL
- **Frontend**: https://sunpathshadowsimulator.vercel.app
- **Backend**: https://sunpath-shadow-simulator.onrender.com 🆕

## 🚀 시작하기

### 필수 요구사항
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Redis (또는 Docker로 실행)

### 1. 저장소 클론 및 설치

```bash
cd "/Users/parkjaemin/Documents/app/SunPath & Shadow Simulator "

# Backend dependencies 설치
cd backend
pip install -r requirements.txt
cd ..

# Frontend dependencies는 이미 설치됨
```

### 2. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

### 3. 개발 서버 실행

#### 옵션 A: Docker Compose 사용 (권장)

```bash
docker-compose up
```

#### 옵션 B: 개별 실행

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. 접속

- 🌐 **Frontend**: http://localhost:3000
- 📡 **Backend API**: http://localhost:8000
- 📖 **API Docs**: http://localhost:8000/docs
- 🔧 **ReDoc**: http://localhost:8000/redoc

## 📁 프로젝트 구조

```
.
├── frontend/              # Next.js 프론트엔드
│   ├── app/              # App Router 페이지
│   ├── components/       # React 컴포넌트
│   └── public/           # 정적 파일
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── api/         # API 엔드포인트
│   │   ├── core/        # 설정 및 유틸리티
│   │   ├── models/      # 데이터 모델
│   │   └── main.py      # FastAPI 앱
│   ├── tests/           # 테스트
│   └── requirements.txt
├── docker-compose.yml    # Docker Compose 설정
└── README.md
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest
```

### Frontend 테스트
```bash
cd frontend
npm test
```

## 📊 API 엔드포인트

### ✅ 구현 완료 (17개 엔드포인트)

**Core:**
- `GET /` - Root endpoint
- `GET /health` - Health check

**Solar Position:**
- `POST /api/solar/position` - 태양 위치 시계열 계산
- `GET /api/solar/sunrise-sunset` - 일출/일몰 시각
- `GET /api/solar/test` - 정확도 검증

**Shadow:**
- `GET /api/shadow/calculate` - 그림자 계산
- `GET /api/shadow/test` - 테스트
- `GET /api/shadow/validate` - 검증

**Irradiance:**
- `GET /api/irradiance/calculate` - 일사량 계산 (Perez Sky Model 지원 ✅ NEW)
- `GET /api/irradiance/test` - 테스트
- `GET /api/irradiance/sunrise-sunset-irradiance` - 일출/일몰 일사량

**Integrated:**
- `POST /api/integrated/calculate` - 통합 계산 ⭐ (프론트엔드 사용)
- `POST /api/integrated/batch` - 배치 계산 (여러 위치/날짜 동시 처리) ✅ NEW

**Cache:**
- `GET /api/cache/stats` - 캐시 통계
- `POST /api/cache/clear` - 캐시 삭제
- `GET /api/cache/test` - 캐시 성능 테스트

**API 문서:** http://localhost:8000/docs

## 🚀 배포 (Deployment)

### Vercel 배포 (Frontend)

#### 1. Vercel 계정 준비
1. [Vercel](https://vercel.com)에 가입/로그인
2. GitHub 계정 연동

#### 2. 프로젝트 배포
```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 프로젝트 배포
vercel
```

또는 Vercel 대시보드에서:
1. **New Project** 클릭
2. GitHub 저장소 선택: `boam79/SunPath_Shadow_Simulator`
3. **Framework Preset**: Next.js (자동 감지됨)
4. **Root Directory**: `frontend` 선택
5. **Environment Variables** 설정:
   ```
   NEXT_PUBLIC_API_URL=https://sunpath-shadow-simulator.onrender.com
   ```
6. **Deploy** 클릭

**기존 프로젝트 환경 변수 수정:**
1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_API_URL` 추가/수정:
   ```
   NEXT_PUBLIC_API_URL=https://sunpath-shadow-simulator.onrender.com
   ```
4. **Save** → **Deployments** → **Redeploy**

#### 3. 배포 후 확인
- 프론트엔드 URL: `https://your-project.vercel.app`
- 자동 HTTPS 적용
- Git push 시 자동 재배포

### Backend 배포

#### Render 배포 (현재 사용 중, v0.1.13+) 🆕

**Render 서비스 설정:**
- **서비스 타입**: Web Service (Free Plan)
- **리전**: Singapore (Southeast Asia)
- **런타임**: Python 3.11
- **URL**: https://sunpath-shadow-simulator.onrender.com

**배포 절차:**
1. [Render](https://render.com)에 가입/로그인 (GitHub 연동 권장)
2. **New +** → **Web Service** 선택
3. GitHub 저장소 연결: `boam79/SunPath_Shadow_Simulator`
4. 설정:
   - **Name**: `sunpath-shadow-simulator`
   - **Root Directory**: `backend` ⚠️ 중요!
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
5. **Environment Variables** 설정:
   ```
   PYTHON_VERSION=3.11.0
   ALLOWED_ORIGINS=https://sunpathshadowsimulator.vercel.app
   ```
6. **Create Web Service** 클릭
7. 배포 완료까지 3-5분 대기

**자동 배포 파일 (render.yaml):**
```yaml
services:
  - type: web
    name: sunpath-backend
    runtime: python
    region: singapore
    plan: free
    branch: master
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: ALLOWED_ORIGINS
        value: https://sunpathshadowsimulator.vercel.app
    healthCheckPath: /health
```

**상세 가이드:**
- [Render 빠른 시작 가이드](./RENDER_QUICK_START.md)
- [Render 배포 가이드](./RENDER_DEPLOYMENT_GUIDE.md)
- [대안 솔루션](./ALTERNATIVE_SOLUTIONS.md)

#### Redis 설정 (선택사항)

Redis는 캐싱 용도로 사용되며, 없어도 백엔드가 정상 작동합니다.

**Render Key Value (무료):**
1. **New +** → **Key Value** 선택
2. Redis 인스턴스 생성
3. Internal Redis URL을 백엔드 `REDIS_URL`에 연결

**참고:** 백엔드는 Redis 연결 실패 시 자동으로 fallback하여 캐싱 없이 정상 작동합니다.

#### AWS EC2 배포 (이전, v0.1.12)

> **참고**: v0.1.13부터 AWS EC2 서버 다운으로 Render로 재마이그레이션되었습니다.

**이전 AWS EC2 설정:**
- **인스턴스 타입**: t3.micro
- **리전**: ap-northeast-2 (서울)
- **퍼블릭 IP**: `54.180.251.93` (현재 응답 없음)

**상세 가이드 (참고용):**
- [AWS 마이그레이션 완료 요약](./docs/MIGRATION_SUMMARY.md)
- [AWS 사용 확인 방법](./docs/AWS_USAGE_VERIFICATION.md)
- [Mixed Content 문제 해결](./docs/MIXED_CONTENT_FIX.md)

### 배포 체크리스트 ✅ (완료)
- [x] Frontend 환경변수 설정 (`NEXT_PUBLIC_API_URL`)
- [x] Backend 환경변수 설정 (`REDIS_URL`, `ALLOWED_ORIGINS`)
- [x] CORS 설정 확인 (backend/app/main.py)
- [x] Redis 연결 테스트
- [x] API 엔드포인트 테스트 (`/health`, `/api/integrated/calculate`)
- [x] 프론트엔드에서 백엔드 API 호출 확인

### 🎉 배포 완료 현황

**프로덕션 환경 (v0.1.13+):**
- ✅ **Frontend**: https://sunpathshadowsimulator.vercel.app (Vercel)
- ✅ **Backend**: https://sunpath-shadow-simulator.onrender.com (Render) 🆕
- ✅ **CORS**: 환경변수 기반 설정으로 해결
- ✅ **HTTPS**: Render에서 자동 SSL 인증서 제공 🆕
- ✅ **자동 배포**: Git push 시 프론트/백엔드 자동 재배포

**이전 프로덕션 환경:**
- ⚠️ **AWS EC2** (v0.1.12): 54.180.251.93 - 서버 다운으로 Render로 마이그레이션 완료
- ⚠️ **Render** (v0.1.11 이하): sunpath-api.onrender.com - 서비스 중단

**주요 해결 사항 (v0.1.13):**
- ✅ AWS EC2 서버 다운 대응으로 Render 재배포 🆕
- ✅ HTTPS 자동 적용 (Mixed Content 문제 완전 해결) 🆕
- ✅ 무료 플랜으로 24/7 운영 (콜드 스타트 있음)
- ✅ GitHub 연동 자동 배포 설정 완료 🆕
- ✅ CORS 오류 해결 (환경변수 기반 `ALLOWED_ORIGINS` 설정)
- ✅ 프론트엔드-백엔드 API 통신 정상화
- ✅ 실시간 태양 경로 및 그림자 시뮬레이션 정상 작동

**Render 무료 플랜 특이사항:**
- ⚠️ 15분 비활성화 시 슬립 모드 (첫 요청 시 30초 콜드 스타트)
- 💡 해결책: UptimeRobot으로 5분마다 ping 전송 권장

### 대안 플랫폼
- **Frontend**: Netlify, Cloudflare Pages
- **Backend**: AWS EC2 (현재 사용 중), Railway, Fly.io, Google Cloud Run, AWS Elastic Beanstalk, Render
- **Redis**: AWS ElastiCache, Upstash, Redis Cloud, Docker Compose

## 🗺️ 개발 로드맵

### Phase 1: MVP ✅ (100% 완료)
- [x] 프로젝트 초기 설정
- [x] 태양 위치 계산 API (NREL SPA 알고리즘)
- [x] 그림자 계산 로직
- [x] 일사량 계산 (Clear Sky Model)
- [x] Redis 캐싱 레이어
- [x] 프론트엔드 UI (반응형, 다크모드)
- [x] 지도 통합 (MapLibre GL JS)
- [x] 지오코딩 (Nominatim)
- [x] 타임라인 애니메이션 (30fps)
- [x] 태양/그림자 시각화
- [x] 데이터 내보내기 (CSV/JSON)
- [x] 차트 시각화 (Recharts) - ✅ v0.1.6 고급 기능 추가
- [x] 테스트 작성
- [x] 배포 (Vercel + Render)
- [x] 지도 범례 추가 - ✅ v0.1.6 추가
- [x] 현재 위치 자동 감지 - ✅ v0.1.6 추가
- [x] 에러 복구 UI 개선 - ✅ v0.1.6 추가
- [x] 고급 차트 시각화 - ✅ v0.1.6 추가
- [x] 컬러 그라데이션 연동 - ✅ v0.1.6 추가
- [x] 최적 시간대 추천 - ✅ v0.1.6 추가
- [x] UI/UX 레이아웃 개선 - ✅ v0.1.6 추가

### Phase 2: 고급 기능 (진행중)
- [x] Perez Sky Model, 배치 계산 API, 계절 비교
- [x] 성능 최적화 (useMemo, 렌더링 최적화)
- [x] 계산 정밀도 개선 (좌표 0.1m)
- [x] AWS EC2 마이그레이션 (v0.1.12) 🆕
- [x] Mixed Content 문제 해결 (v0.1.12) 🆕
- [ ] 네이버 지도 통합 (예정)
- [ ] SSL 인증서 설정 (도메인 필요)

---

## 📝 개발 가이드

### Backend 새 API 추가
1. `backend/app/api/` 에 라우터 파일 생성
2. `backend/app/main.py` 에 라우터 import 및 include
3. `backend/app/models/schemas.py` 에 스키마 정의

### Frontend 새 페이지 추가
1. `frontend/app/` 에 폴더 및 `page.tsx` 생성
2. 컴포넌트는 `frontend/components/` 에 작성

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 📋 최근 버전

### v0.1.13 (최신) 🆕
- **Render 재배포**: AWS EC2 서버 다운으로 Render.com으로 재마이그레이션
- **HTTPS 자동 적용**: Render에서 SSL 인증서 자동 제공, Mixed Content 문제 완전 해결
- **무료 플랜 운영**: 24/7 운영 가능 (콜드 스타트 있음)
- **자동 배포 설정**: `render.yaml` 파일로 자동 배포 구성
- **문서화**: Render 배포 가이드 및 대안 솔루션 문서 추가
- **Backend URL**: https://sunpath-shadow-simulator.onrender.com

### v0.1.12
- **AWS EC2 마이그레이션**: Render에서 AWS EC2로 백엔드 마이그레이션 완료
- **성능 개선**: Cold Start 문제 해결, 응답 시간 개선 (100-200ms)
- **Mixed Content 해결**: Next.js API Route 프록시 구현
- **인프라 개선**: Nginx 역방향 프록시, Systemd 자동 시작 설정
- **문서화**: AWS 마이그레이션 가이드 및 확인 방법 문서 추가
- ⚠️ **현재 상태**: 서버 다운 (v0.1.13에서 Render로 재마이그레이션)

### v0.1.11
- **다국어 지원 확장**: 모든 새 기능 번역 (배치/계절/고급옵션/프리셋)
- **헤더 초기화**: 클릭 시 서울 기본 위치로 재설정
- **UX 개선**: 초기 렌더링 중복 계산 방지

### v0.1.10
- **콘솔 에러 수정**: CoreLocation 에러, MapLibre 스타일 경고 해결
- **UX 개선**: GeolocateControl 최적화, 개발 모드 전용 로그

### v0.1.9
- **성능 최적화**: useMemo 적용, 렌더링 최적화, 계산 정밀도 개선
- **정밀도 개선**: 좌표 캐시 0.1m 정밀도, Perez 모델 기본값
- **코드 품질**: 불필요한 import 제거, 빌드 경고 해결

### v0.1.8
- **고급 옵션**: Perez Sky Model, 시간 간격 조절, 단위 선택
- **배치 계산**: 여러 위치/날짜 동시 처리
- **계절 비교**: 봄/여름/가을/겨울 데이터 비교
- **프리셋 관리**: 사용자 설정 저장/불러오기

### v0.1.7 - 다국어 지원
- 한국어/영어 지원 (i18n)
- SEO 최적화 (Google Search Console)
- HTML `lang` 속성 동적 업데이트

### v0.1.6 - UI/UX 개선
- 지도/타임라인 상단 고정
- 차트 애니메이션 최적화
- 사이드바 컴팩트화

### v0.1.0 - 초기 릴리즈
MVP: 태양 경로, 그림자, 일사량 계산, 타임라인 애니메이션

## 👥 팀

- **boam79** - 프로젝트 리더

## 📚 참고 자료

- [NREL Solar Position Algorithm](https://www.nrel.gov/docs/fy08osti/34302.pdf)
- [pvlib-python Documentation](https://pvlib-python.readthedocs.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MapLibre GL JS](https://maplibre.org/)

---

**버전:** 0.1.13
**최종 수정:** 2026-01-21

## 🔒 보안 정보

### React Server Components 보안 취약점 (CVE-2025-55182)

**현재 상태:** ✅ 안전

- **현재 사용 버전**: React 18.3.1, Next.js 14.2.33
- **취약점 영향**: React 19.x (19.0, 19.1.0, 19.1.1, 19.2.0)만 영향받음
- **현재 프로젝트**: React 18 사용 중이므로 취약점의 직접적인 영향 없음

**참고:**
- [React 보안 공지](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- React 19.x를 사용하는 경우 즉시 19.0.1, 19.1.2, 또는 19.2.1로 업그레이드 필요
- Next.js 15.x/16.x 사용 시 해당 버전의 패치 버전으로 업그레이드 필요
