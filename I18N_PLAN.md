# 🌐 다국어 지원 (i18n) 구현 계획서

**작성일:** 2025-01-30  
**프로젝트:** SunPath & Shadow Simulator  
**목표:** 한국어/영어 다국어 지원

---

## 📋 개요

현재 프로젝트는 한국어로만 구성되어 있습니다. 전 세계 사용자를 위한 영어 지원을 추가하여 접근성을 향상시키겠습니다.

---

## 🎯 구현 전략

### 옵션 1: next-intl (권장) ⭐
**장점:**
- Next.js 14 App Router 전용 라이브러리
- 타입 안전성 우수
- 서버/클라이언트 컴포넌트 모두 지원
- SEO 친화적 (URL 기반 locale)
- 기본 성능 최적화

**단점:**
- 설정이 다소 복잡
- 파일 구조 변경 필요

### 옵션 2: react-i18next
**장점:**
- 널리 사용, 레퍼런스 풍부
- 검증된 안정성

**단점:**
- App Router와 호환성 낮음
- 클라이언트 전용
- SEO에 불리

### 옵션 3: 커스텀 i18n
**장점:**
- 완전 커스터마이징
- 번들 크기 최소

**단점:**
- 구현 비용 높음
- 기능 제한
- 유지보수 부담

**→ 선택: next-intl (App Router 최적)**

---

## 🗂️ 파일 구조

구현 후 예상 구조:

```
frontend/
├── app/
│   ├── [locale]/              # ← 새로 생성 (다국어 라우팅)
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx             # 리다이렉션용
│   ├── globals.css
│   └── sitemap.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainContent.tsx
│   └── ...
├── i18n/
│   ├── request.ts             # next-intl 설정
│   ├── locales/
│   │   ├── ko/
│   │   │   └── messages.ts   # 한국어 번역
│   │   └── en/
│   │       └── messages.ts   # 영어 번역
│   └── config.ts              # 지원 언어 설정
└── public/
```

---

## 📝 번역 대상 항목

### 1. 레이아웃/헤더
```typescript
// Header.tsx
ko: "SunPath & Shadow Simulator"
en: "SunPath & Shadow Simulator"

ko: "태양 경로 · 일조량 · 그림자 시뮬레이터"
en: "Solar Path · Irradiance · Shadow Simulator"
```

### 2. 사이드바/입력 필드
```typescript
// Sidebar.tsx
ko: "위치"
en: "Location"

ko: "날짜"
en: "Date"

ko: "물체 높이"
en: "Object Height"

ko: "주소 검색 (예: 서울특별시 중구)"
en: "Search address (e.g., Seoul, South Korea)"

ko: "현재 위치 사용"
en: "Use Current Location"

ko: "타임라인"
en: "Timeline"

ko: "시각"
en: "Time"

ko: "현재 설정"
en: "Current Settings"

ko: "데이터 내보내기"
en: "Export Data"

ko: "카카오페이로 후원하기"
en: "Donate via KakaoPay"
```

### 3. 지도/시각화
```typescript
// Map.tsx
ko: "위치:"
en: "Location:"

ko: "태양 고도:"
en: "Solar Altitude:"

ko: "그림자 길이:"
en: "Shadow Length:"

ko: "일사량:"
en: "Irradiance:"
```

### 4. 차트
```typescript
// Chart.tsx
ko: "태양 고도"
en: "Solar Altitude"

ko: "방위각"
en: "Azimuth"

ko: "일사량 (W/m²)"
en: "Irradiance (W/m²)"

ko: "그림자 길이 (m)"
en: "Shadow Length (m)"

ko: "시간"
en: "Time"
```

### 5. 최적화 패널
```typescript
// OptimizationPanel.tsx
ko: "최적 일조 시간"
en: "Optimal Sunlight Hours"

ko: "최대 태양 고도"
en: "Maximum Solar Altitude"

ko: "일일 총 일사량"
en: "Daily Total Irradiance"

ko: "일출/일몰"
en: "Sunrise/Sunset"
```

### 6. 버튼/액션
```typescript
// 공통
ko: "재생"
en: "Play"

ko: "일시정지"
en: "Pause"

ko: "CSV"
en: "CSV"

ko: "JSON"
en: "JSON"

ko: "요약"
en: "Summary"

ko: "복사"
en: "Copy"
```

### 7. 에러 메시지
```typescript
ko: "위치 정보를 가져올 수 없습니다"
en: "Unable to retrieve location"

ko: "데이터를 불러오는 중 오류가 발생했습니다"
en: "Error loading data"

ko: "API 연결 끊김"
en: "API disconnected"
```

### 8. 푸터
```typescript
ko: "© 2025 SunPath & Shadow Simulator"
en: "© 2025 SunPath & Shadow Simulator"

ko: "제작자:"
en: "Created by:"

ko: "문의사항:"
en: "Contact:"

ko: "© 2025 SunPath & Shadow Simulator"
en: "© 2025 SunPath & Shadow Simulator"
```

### 9. 메타데이터
```typescript
// layout.tsx
ko: "위치와 날짜를 입력하면 정확한 태양 경로, 일조량, 그림자 방향을 실시간으로 시각화하는 웹 기반 시뮬레이터입니다. 건축, 조경, 태양광 설계에 활용하세요."
en: "Visualize accurate solar path, irradiance, and shadow direction in real-time based on location and date. Use for architecture, landscape, and solar design."
```

---

## 🛠️ 구현 단계

### Phase 1: 환경 설정 (30분)
1. ✅ `next-intl` 패키지 설치
   ```bash
   cd frontend
   npm install next-intl
   ```

2. ✅ 기본 설정 파일 생성
   - `i18n/config.ts` - 지원 언어 정의
   - `i18n/request.ts` - next-intl 설정
   - `i18n/locales/ko/messages.ts` - 한국어 번역
   - `i18n/locales/en/messages.ts` - 영어 번역

3. ✅ App Router 구조 변경
   - `app/[locale]/page.tsx` 생성
   - `app/[locale]/layout.tsx` 생성
   - 기존 페이지를 `app/[locale]`로 이동

### Phase 2: 번역 파일 작성 (1-2시간)
4. ✅ 번역 키-값 쌍 정의
   - 모든 하드코딩된 문자열 추출
   - 의미 단위로 그룹화
   - 중앙화된 번역 파일 작성

5. ✅ 번역 파일 작성
   - 한국어: 기존 텍스트 그대로
   - 영어: 전문 번역 (필요 시 검토)

### Phase 3: 컴포넌트 적용 (2-3시간)
6. ✅ 모든 컴포넌트에 i18n 적용
   - Header, Sidebar, MainContent
   - Map, Chart, Timeline
   - OptimizationPanel
   - Footer

7. ✅ 다국어 전환 UI 추가
   - 언어 선택 드롭다운/토글
   - 헤더에 배치

### Phase 4: SEO 최적화 (30분)
8. ✅ 다국어 SEO 적용
   - `hreflang` 태그 추가
   - sitemap에 다국어 URL 포함
   - 메타데이터 다국어화

### Phase 5: 테스트 및 검증 (1시간)
9. ✅ 기능 테스트
   - 언어 전환 작동 확인
   - 모든 텍스트 표시 확인
   - URL 라우팅 확인

10. ✅ 브라우저 테스트
    - Chrome, Firefox, Safari
    - 모바일 반응형 확인

---

## 📊 예상 작업 시간

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | 환경 설정 | 30분 |
| 2 | 번역 파일 작성 | 1-2시간 |
| 3 | 컴포넌트 적용 | 2-3시간 |
| 4 | SEO 최적화 | 30분 |
| 5 | 테스트 및 검증 | 1시간 |
| **총계** | | **5-7시간** |

---

## 🌍 지원 언어

### 1단계: 기본 지원
- ✅ **한국어 (ko)** - 기본 언어
- ✅ **영어 (en)** - 기본 영어

### 2단계: 확장 (선택)
- 일본어 (ja) - 태양광 시장이 큰 국가
- 중국어 (zh-CN) - 대규모 사용자층
- 스페인어 (es) - 중남미 시장
- 독일어 (de) - 유럽 태양광 선도국

---

## 🔧 기술적 고려사항

### 1. URL 구조
```
// 기본 (한국어)
https://sunpathshadowsimulator.vercel.app

// 영어
https://sunpathshadowsimulator.vercel.app/en

// 추후 확장
https://sunpathshadowsimulator.vercel.app/ja
https://sunpathshadowsimulator.vercel.app/zh-CN
```

### 2. 브라우저 언어 감지
- 자동으로 사용자 브라우저 언어 감지
- 지원하지 않는 언어는 기본 언어(kr)로 폴백

### 3. 상태 관리
- 언어 설정은 쿠키에 저장 (영구적)
- URL에 locale 포함 (SEO)

### 4. 성능 최적화
- 번역 파일은 지연 로딩
- 필요한 언어만 로드

---

## ⚠️ 주의사항

1. **기존 링크 호환성**
   - 기존 사용자의 북마크 유지
   - 리다이렉션 처리

2. **SEO 영향**
   - 다국어 URL로 분리 시 검색 순위 영향 가능
   - `hreflang` 태그로 완화

3. **번역 품질**
   - 기술 용어 일관성 유지
   - 전문 번역 검토 권장

4. **테스트 범위**
   - 모든 화면 및 기능
   - 브라우저 호환성
   - 모바일 반응형

---

## 📈 기대 효과

1. **글로벌 사용자 확대**
   - 영어권 사용자 유입 증가

2. **SEO 개선**
   - 다국어 키워드로 검색 노출 증가

3. **접근성 향상**
   - 더 많은 사용자가 이용 가능

4. **전문성 향상**
   - 국제적 신뢰도 증대

---

## 🎯 다음 단계

구현을 시작하시겠습니까?

**추천 순서:**
1. ✅ next-intl 설치 및 기본 설정
2. ✅ 번역 파일 구조 생성
3. ✅ 헤더/사이드바에 적용
4. ✅ 나머지 컴포넌트 적용
5. ✅ 다국어 전환 UI 추가
6. ✅ 테스트 및 배포

---

**문서 버전:** 1.0  
**최종 수정:** 2025-01-30

