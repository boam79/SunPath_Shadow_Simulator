# 🌞 SunPath & Shadow Simulator

웹 기반 태양 경로, 일조량, 그림자 실시간 시뮬레이터

## 📋 프로젝트 개요

위치와 날짜를 입력하면 해당 위치의 일조량, 태양의 움직임, 그림자 방향 및 길이를 실시간으로 시각화하는 시뮬레이터입니다.

### 주요 기능
- 🗺️ 주소 기반 위치 검색 (지오코딩)
- ☀️ 고정밀 태양 경로 계산 (NREL SPA 알고리즘)
- 🌗 실시간 그림자 시뮬레이션
- 📊 일사량 계산 (GHI/DNI/DHI)
- 🎬 타임라인 애니메이션 (30fps)
- 📥 데이터 내보내기 (CSV/JSON)

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** - App Router, TypeScript
- **Tailwind CSS** - 스타일링
- **MapLibre GL JS** - 지도 표시
- **Recharts** - 차트 시각화

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

### ✅ 구현 완료 (16개 엔드포인트)

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
- `GET /api/irradiance/calculate` - 일사량 계산
- `GET /api/irradiance/test` - 테스트
- `GET /api/irradiance/sunrise-sunset-irradiance` - 일출/일몰 일사량

**Integrated:**
- `POST /api/integrated/calculate` - 통합 계산 ⭐ (프론트엔드 사용)

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

### 배포 체크리스트
- [ ] Frontend 환경변수 설정 (`NEXT_PUBLIC_API_URL`)
- [ ] Backend 환경변수 설정 (`REDIS_URL`, `ALLOWED_ORIGINS`)
- [ ] CORS 설정 확인 (backend/app/main.py)
- [ ] Redis 연결 테스트
- [ ] API 엔드포인트 테스트 (`/health`, `/api/integrated/calculate`)
- [ ] 프론트엔드에서 백엔드 API 호출 확인

### 대안 플랫폼
- **Frontend**: Netlify, Cloudflare Pages
- **Backend**: Railway, Fly.io, Google Cloud Run, AWS Elastic Beanstalk
- **Redis**: Upstash, Redis Cloud

## 🗺️ 개발 로드맵

### Phase 1: MVP ✅ (87% 완료)
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
- [ ] 차트 시각화 (선택적)
- [ ] 테스트 작성
- [ ] 배포

### Phase 2: 고급 기능
- [ ] 네이버 지도(Naver Maps JS v3) 통합 및 기본 지도 엔진 전환 예정
- [ ] Perez Sky Model
- [ ] 사용자 프리셋
- [ ] 배치 계산 API
- [ ] 성능 최적화
- [ ] 차트 라이브러리 통합

### Phase 3: 엔터프라이즈
- [ ] 3D 그림자 렌더링
- [ ] AI 기반 최적화
- [ ] 화이트 라벨링

## 🔍 품질 점검 결과와 고도화 제안

> 현재 코드와 실행 로그를 기반으로 즉시 적용 가능한 개선 사항을 정리했습니다. 우선순위 순으로 나열합니다.

### 1) 프론트엔드 안정성/UX
- [권장] 헤더 타이틀 초기화: 구현됨. 모바일 드로워 토글 구현됨. 유지보수 가이드 README 반영 완료.
- [권장] 지도 Import 경로 고정: `react-map-gl/maplibre`를 사용해야 합니다. 에러 로그에 `import ... from 'react-map-gl'`가 재등장하므로, `frontend/components/Map.tsx` 임포트가 되돌아가지 않도록 점검하세요.
  - 올바른 예: `import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre'`
- [권장] 레이아웃 안정화: 지도 높이 `32vh/40vh`, 패널 여백 축소, 타임라인 패널 내 배치로 한 화면 가시성 확보. 뷰포트 높이 iOS 보정(`svh/dvh`) 도입 권장.
- [권장] 에러 바운더리 추가: 지도 모듈/타임라인 영역에 React Error Boundary 적용해 런타임 에러가 전체 페이지를 중단시키지 않도록.
- [권장] 접근성(A11y): 타임라인 버튼에 `aria-label` 강화, 키보드 포커스 스타일 추가.
- [선택] PWA 지원: 오프라인 진입 시 마지막 계산 데이터 보기.

### 2) 타임라인/애니메이션
- [개선] 재생 루프: 현재 30fps `setInterval` 기반. `requestAnimationFrame` + 시간기반 보간으로 부드럽게 전환 권장.
- [개선] “컴팩트 모드” 스위치: 패널 더 작은 모드로 토글 가능하게.
- [개선] 키보드 쇼트컷: ←/→ 10분, ⇧+←/→ 1시간, Space 재생/정지.

### 3) 지오코딩/리버스 지오코딩
- [안정성] Nominatim 사용 정책 준수: `User-Agent`와 `referer` 명시, 요청 속도 제한(디바운스 외 rate limit) 권장.
- [UX] 도로명/지번 표기 동시 제공, 결과 항목에 행정동/법정동 배지 추가.

### 4) 백엔드 정확도/탄탄함
- [정확도] 시간대 처리: 현재 경도기반 오프셋(단순) 사용. `timezonefinder` + `pytz`/`zoneinfo`로 실제 타임존을 계산해 로컬 태양시와 일출/일몰 일치 정확도 향상.
- [정합성] JSON 안전화: `safe_number` 적용됨. 서비스 레벨에서 Pydantic 모델 필드에 `field_validator`로 NaN/Inf 차단 중복 방어 추가 권장.
- [성능] Redis 키 전략: 요청 파라미터 정규화(소수점 자리 제한)로 캐시 히트율 개선. TTL은 `.env`로 노출.
- [신뢰성] 외부 API(지오코딩 등) 호출 시 백오프/타임아웃/재시도 정책 통일.

### 5) 테스트/품질
- [필수] 단위/통합 테스트 보강:
  - FastAPI: 각 엔드포인트 2xx/4xx/5xx 시나리오, 캐시 적중/미스 테스트
  - 프론트엔드: Timeline, Map 상호작용, 지오코딩 UI 디바운스
- [필수] E2E 테스트(Playwright): 위치 선택 → 계산 → 타임라인 재생까지 시나리오 자동화
- [권장] CI 파이프라인(GitHub Actions): lint, test, build, docker build

### 6) 보안/운영
- [보안] CORS 제한: 개발 외 환경에서 `allow_origins`를 도메인 화이트리스트로 제한.
- [보안] 환경변수 검증: 필수 키 누락시 부팅 실패하도록 `.env` 스키마 검사.
- [운영] Docker 이미지 슬림화: 멀티스테이지 빌드와 `python:3.11-slim`/`node:20-alpine` 사용.
- [가시성] 로깅 표준화(structlog/uvicorn formatter)와 요청 트레이싱 ID.

### 7) 기능 고도화 로드맵+태스크
- [ ] 지도 범례/표기: 빨간 핀(기준점), 노란 점선(그림자 궤적) 등 의미를 지도 우측 하단에 간단히 표기
- [ ] 일사량/고도 기반 컬러 그라데이션: 타임라인 슬라이더와 맵 선 색상 연동
- [ ] 차트(선택): 시간대별 고도/방위/일사량 3축 요약 차트
- [ ] 사용자 프리셋 저장/불러오기(LocalStorage)
- [ ] 다국어(i18n): ko/en 토글

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

## 👥 팀

- **boam79** - 프로젝트 리더

## 📚 참고 자료

- [NREL Solar Position Algorithm](https://www.nrel.gov/docs/fy08osti/34302.pdf)
- [pvlib-python Documentation](https://pvlib-python.readthedocs.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MapLibre GL JS](https://maplibre.org/)

---

**버전:** 0.1.0  
**최종 수정:** 2025-10-20

### 부록: 트러블슈팅 메모
- Next.js 빌드 오류 `Unexpected token div`: JSX 중첩/닫힘 태그 검증. 편집 시 `<div>` 짝 확인.
- `Module not found: Package path . is not exported from react-map-gl`: MapLibre 사용 시 `react-map-gl/maplibre`로 임포트할 것.
- `ValueError: Out of range float values are not JSON compliant`: 백엔드에서 NaN/Inf → None 변환 유지.
