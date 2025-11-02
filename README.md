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
   NEXT_PUBLIC_API_URL=https://your-backend-api-url.com
   ```
6. **Deploy** 클릭

#### 3. 배포 후 확인
- 프론트엔드 URL: `https://your-project.vercel.app`
- 자동 HTTPS 적용
- Git push 시 자동 재배포

### Backend 배포 (Render 권장)

#### Render 배포
1. [Render](https://render.com)에 가입/로그인
2. **New +** → **Web Service** 선택
3. GitHub 저장소 연결
4. 설정:
   - **Name**: `sunpath-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables** 설정:
   ```
   REDIS_URL=redis://red-xxxxx:6379
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
6. **Create Web Service** 클릭

#### Redis 추가 (Render)
1. **New +** → **Redis** 선택
2. Redis 인스턴스 생성
3. Internal Redis URL을 백엔드 `REDIS_URL`에 연결

### 배포 체크리스트 ✅ (완료)
- [x] Frontend 환경변수 설정 (`NEXT_PUBLIC_API_URL`)
- [x] Backend 환경변수 설정 (`REDIS_URL`, `ALLOWED_ORIGINS`)
- [x] CORS 설정 확인 (backend/app/main.py)
- [x] Redis 연결 테스트
- [x] API 엔드포인트 테스트 (`/health`, `/api/integrated/calculate`)
- [x] 프론트엔드에서 백엔드 API 호출 확인

### 🎉 배포 완료 현황

**프로덕션 환경:**
- ✅ **Frontend**: https://sunpathshadowsimulator.vercel.app (Vercel)
- ✅ **Backend**: https://sunpath-api.onrender.com (Render)
- ✅ **Redis**: Render Redis 인스턴스 연결됨
- ✅ **CORS**: 환경변수 기반 설정으로 해결
- ✅ **자동 배포**: Git push 시 자동 재배포 활성화

**주요 해결 사항:**
- ✅ CORS 오류 해결 (환경변수 기반 `ALLOWED_ORIGINS` 설정)
- ✅ Render 백엔드 502 오류 해결 (수동 재배포)
- ✅ 프론트엔드-백엔드 API 통신 정상화
- ✅ 실시간 태양 경로 및 그림자 시뮬레이션 정상 작동

### 대안 플랫폼
- **Frontend**: Netlify, Cloudflare Pages
- **Backend**: Railway, Fly.io, Google Cloud Run, AWS Elastic Beanstalk
- **Redis**: Upstash, Redis Cloud

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
- [ ] 네이버 지도 통합 (예정)
- [ ] 성능 최적화 추가

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

### v0.1.8 (최신)
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

**버전:** 0.1.8
**최종 수정:** 2025-11-02
