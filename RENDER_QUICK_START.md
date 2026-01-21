# 🚀 Render 빠른 시작 가이드 (5분 완성)

## 당신이 제공해야 하는 것:

### ✅ 필수 (이것만 있으면 됩니다!)
1. **GitHub 계정** - 로그인만 하면 됩니다
2. **이메일 주소** - Render 가입용

### 🎉 이미 준비 완료!
- ✅ GitHub 저장소: `boam79/SunPath_Shadow_Simulator`
- ✅ 백엔드 코드 푸시 완료
- ✅ `render.yaml` 자동 배포 설정 포함
- ✅ `requirements.txt` 준비됨

---

## 📝 단계별 실행 (정확히 5분)

### 1단계: Render 가입 (1분)

1. 브라우저에서 열기: **https://render.com**

2. 우측 상단 **"Get Started for Free"** 클릭

3. **"Sign Up with GitHub"** 선택 (이게 제일 빠름!)
   - GitHub 로그인
   - "Authorize Render" 클릭
   - 완료!

---

### 2단계: 저장소 연결 (30초)

1. Render 대시보드에서:
   - 우측 상단 **"New +"** 클릭
   - **"Web Service"** 선택

2. GitHub 저장소 찾기:
   - 검색창에 "SunPath" 입력
   - **"SunPath_Shadow_Simulator"** 찾기
   - **"Connect"** 클릭

---

### 3단계: 서비스 설정 (2분)

**✨ 자동 감지된 설정 확인:**

이미 `render.yaml` 파일이 있어서 대부분 자동 입력됩니다!

확인만 하세요:

```
✓ Name: sunpath-backend
✓ Region: Singapore
✓ Branch: master  
✓ Root Directory: backend
✓ Runtime: Python 3
✓ Build Command: pip install -r requirements.txt
✓ Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Plan 선택:**
- **Free** 선택 (자동 선택됨)

**Environment Variables (자동 포함됨):**
```
PYTHON_VERSION = 3.11.0
ALLOWED_ORIGINS = https://sunpath-simulator.vercel.app,http://localhost:3000
```

---

### 4단계: 배포 시작 (30초)

1. 페이지 하단 **"Create Web Service"** 버튼 클릭

2. 배포 진행 화면으로 이동
   - 실시간 로그 확인 가능
   - "Building..." → "Deploying..." → "Live" 표시

**예상 완료 시간:** 3-5분

---

### 5단계: URL 확인 및 테스트 (1분)

배포 완료 후:

1. **백엔드 URL 확인**
   - 화면 상단에 표시됨
   - 예: `https://sunpath-backend.onrender.com`

2. **브라우저에서 테스트**
   
   다음 URL을 새 탭에서 열어보세요:
   
   ```
   https://your-app.onrender.com/health
   ```
   
   **예상 결과:**
   ```json
   {"status":"healthy","service":"sunpath-api"}
   ```

3. **API 문서 확인**
   ```
   https://your-app.onrender.com/docs
   ```

---

## 🎯 배포 완료 후 해야 할 일

### A. 백엔드 URL 복사
Render 대시보드에서 URL 복사:
```
예: https://sunpath-backend.onrender.com
```

### B. 프론트엔드에 연결

**방법 1: Vercel로 배포**
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=https://your-app.onrender.com" > .env.local
npx vercel --prod
```

**방법 2: 로컬 테스트**
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=https://your-app.onrender.com" > .env.local
npm run dev
```

---

## ✅ 최종 확인 체크리스트

배포 성공 확인:
- [ ] Render에서 "Live" 상태 표시
- [ ] `/health` 엔드포인트 응답 확인
- [ ] `/docs` 페이지 접속 가능
- [ ] 백엔드 URL 복사 완료

프론트엔드 연결:
- [ ] `.env.local` 파일 생성
- [ ] `NEXT_PUBLIC_API_URL` 설정
- [ ] 프론트엔드 실행/배포
- [ ] 실제 API 호출 테스트

---

## 🎁 보너스 팁

### 자동 배포 설정 (이미 활성화됨)
- Git push하면 자동으로 재배포
- Settings → "Auto-Deploy: Yes" 확인

### 슬립 모드 방지 (선택사항)
무료 플랜은 15분 비활성화 시 슬립 모드 진입

**해결법:**
1. https://uptimerobot.com 가입
2. "Add New Monitor" 클릭
3. URL 입력: `https://your-app.onrender.com/health`
4. Interval: 5분
5. 완료! 이제 항상 깨어있음

### 커스텀 도메인 (선택사항)
Settings → Custom Domains:
- 자신의 도메인 연결 가능
- 예: `api.yourdomain.com`

---

## 🐛 문제 발생 시

### "Build Failed" 에러
**해결:**
1. Render 대시보드 → Settings
2. Root Directory = `backend` 확인
3. Python Version = 3 확인
4. Manual Deploy → "Deploy latest commit"

### "No such file or directory" 에러
**확인:**
- Root Directory가 `backend`로 설정되었는지
- GitHub에 `backend/requirements.txt` 존재하는지

### CORS 에러 (프론트엔드에서)
**해결:**
1. Settings → Environment
2. `ALLOWED_ORIGINS` 값에 프론트엔드 URL 추가
3. 예: `https://my-app.vercel.app,http://localhost:3000`

---

## 📞 도움이 필요하면

각 단계에서 막히면:
1. 스크린샷 캡처
2. 에러 메시지 복사
3. 질문하기

즉시 도와드리겠습니다! 🚀

---

## 🎉 성공하면

백엔드 URL과 프론트엔드 URL을 공유해주세요!
실제 동작 확인 도와드리겠습니다.

**예상 결과:**
- ✅ 백엔드: `https://sunpath-backend.onrender.com`
- ✅ 프론트엔드: `https://sunpath-simulator.vercel.app`
- ✅ 완전 작동하는 무료 서비스 완성! 🎊
