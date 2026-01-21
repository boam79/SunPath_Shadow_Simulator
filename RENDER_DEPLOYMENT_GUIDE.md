# Render.com 배포 가이드

**배포 시간:** 10-15분  
**비용:** 완전 무료  
**결과:** 24/7 운영되는 백엔드 API

---

## 📋 준비 사항 체크리스트

### 당신이 제공해야 하는 것:
- [ ] **GitHub 계정** (로그인 정보)
- [ ] **이메일 주소** (Render 가입용)
- [ ] 그게 전부입니다! 🎉

### 이미 준비된 것:
- ✅ GitHub 저장소 연결됨
- ✅ 백엔드 코드 준비 완료
- ✅ requirements.txt 존재
- ✅ FastAPI 앱 정상 작동

---

## 🚀 단계별 배포 가이드

### 1단계: 코드를 GitHub에 푸시 (1분)

현재 작업 내용을 GitHub에 올립니다.

```bash
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator

# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Prepare for Render deployment"

# GitHub에 푸시
git push origin master
```

**확인:** GitHub 웹사이트에서 코드가 업데이트되었는지 확인

---

### 2단계: Render.com 회원가입 (2분)

1. **웹사이트 접속**
   - https://render.com 열기

2. **회원가입**
   - "Get Started for Free" 클릭
   - **"Sign Up with GitHub"** 선택 (추천 ⭐)
   - 또는 이메일로 가입

3. **GitHub 연동 승인**
   - Render가 GitHub 저장소 접근 허용
   - "Authorize Render" 클릭

**완료:** Render 대시보드 화면이 나타남

---

### 3단계: 백엔드 서비스 생성 (3분)

Render 대시보드에서:

#### 3-1. New 버튼 클릭
- 오른쪽 상단 **"New +"** 버튼
- **"Web Service"** 선택

#### 3-2. 저장소 선택
- GitHub 저장소 목록에서 **"SunPath_Shadow_Simulator"** 찾기
- 안 보이면 "Configure account" → All repositories 허용
- **"Connect"** 클릭

#### 3-3. 서비스 설정 입력

다음 정보를 정확히 입력하세요:

| 항목 | 입력 값 |
|------|---------|
| **Name** | `sunpath-backend` (또는 원하는 이름) |
| **Region** | `Singapore` (또는 가까운 지역) |
| **Branch** | `master` (또는 `main`) |
| **Root Directory** | `backend` ⚠️ 중요! |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

**중요:** Root Directory를 `backend`로 설정해야 합니다!

#### 3-4. 인스턴스 타입 선택
- **Free Plan** 선택 (월 $0)
- 자동으로 체크되어 있음

---

### 4단계: 환경 변수 설정 (2분)

같은 페이지에서 아래로 스크롤:

#### 환경 변수 추가

**"Add Environment Variable"** 버튼 클릭하고 다음 추가:

```
이름: ALLOWED_ORIGINS
값: https://sunpath-simulator.vercel.app,http://localhost:3000
```

```
이름: PYTHON_VERSION
값: 3.11.0
```

**Redis는 선택사항** (나중에 추가 가능)

---

### 5단계: 배포 시작 (1-2분)

- 페이지 하단 **"Create Web Service"** 클릭
- 배포 로그가 실시간으로 표시됨
- "Build successful" → "Deploy live" 메시지 확인

**배포 완료 시간:** 약 3-5분

---

### 6단계: 백엔드 URL 확인 및 테스트 (1분)

배포 완료 후:

1. **URL 복사**
   - Render 대시보드 상단에 표시됨
   - 예: `https://sunpath-backend.onrender.com`

2. **브라우저에서 테스트**
   ```
   https://your-app.onrender.com/health
   https://your-app.onrender.com/docs
   ```

3. **예상 응답:**
   ```json
   {
     "status": "healthy",
     "service": "sunpath-api"
   }
   ```

---

### 7단계: 프론트엔드 연결 (2분)

백엔드 URL을 프론트엔드에 연결:

```bash
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator/frontend

# .env.local 파일 생성 (백엔드 URL 입력)
echo "NEXT_PUBLIC_API_URL=https://your-app.onrender.com" > .env.local

# Vercel에 배포
npx vercel --prod
```

**완료!** 🎉

---

## 🎯 배포 후 확인 사항

### 백엔드 테스트
```bash
# Health check
curl https://your-app.onrender.com/health

# API 문서
# 브라우저에서: https://your-app.onrender.com/docs

# Solar API 테스트
curl "https://your-app.onrender.com/api/solar/test"
```

### 프론트엔드 테스트
- Vercel URL 접속
- 지도에서 위치 클릭
- 태양 경로 시뮬레이션 작동 확인

---

## ⚙️ Render 설정 상세

### 자동 배포 설정 (권장)
Render 대시보드 → Settings:

- **Auto-Deploy**: `Yes` (기본값)
- Git push 시 자동으로 재배포됨

### 커스텀 도메인 (선택사항)
Settings → Custom Domains:
- 자신의 도메인 연결 가능
- 예: `api.yourdomain.com`

### 환경 변수 추가 (나중에)
Settings → Environment:
- Redis URL 추가
- API 키 추가 등

---

## ⚠️ 무료 플랜 제약사항

### 콜드 스타트 (Cold Start)
- **15분 비활성화 시 슬립 모드**
- 첫 요청 시 30초 소요 (깨어나는 시간)
- 이후 요청은 즉시 응답

### 해결 방법:
1. **외부 모니터링** (무료):
   ```
   https://uptimerobot.com
   - 5분마다 자동 핑
   - 슬립 방지
   ```

2. **유료 플랜 전환** ($7/월):
   - 콜드 스타트 없음
   - 더 많은 리소스

---

## 🐛 문제 해결

### "Build failed" 에러
**원인:** Root Directory 설정 오류  
**해결:**
1. Settings → Build & Deploy
2. Root Directory를 `backend`로 수정
3. Manual Deploy → Deploy latest commit

### "Module not found" 에러
**원인:** requirements.txt 누락  
**해결:**
```bash
cd backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Add requirements"
git push
```

### "Port binding failed" 에러
**원인:** Start Command 오류  
**해결:**
```
올바른 명령어: uvicorn app.main:app --host 0.0.0.0 --port $PORT
⚠️ $PORT 환경변수 필수!
```

### API 요청 CORS 에러
**원인:** ALLOWED_ORIGINS 누락  
**해결:**
1. Settings → Environment
2. ALLOWED_ORIGINS 추가
3. 값: 프론트엔드 URL 입력

---

## 📊 배포 체크리스트

배포 전:
- [ ] Git push 완료
- [ ] GitHub 저장소 public/private 확인
- [ ] requirements.txt 존재

Render 설정:
- [ ] Root Directory = `backend`
- [ ] Python 3.11 선택
- [ ] Start Command 정확히 입력
- [ ] ALLOWED_ORIGINS 환경변수 추가

배포 후:
- [ ] /health 엔드포인트 응답 확인
- [ ] /docs 접속 가능 확인
- [ ] 프론트엔드 연결 테스트
- [ ] 실제 API 호출 테스트

---

## 🎁 보너스: 모니터링 설정

### UptimeRobot으로 슬립 방지 (무료)

1. https://uptimerobot.com 가입
2. "Add New Monitor" 클릭
3. 설정:
   - Monitor Type: HTTP(s)
   - URL: `https://your-app.onrender.com/health`
   - Monitoring Interval: 5 minutes
4. 완료! 이제 서버가 자동으로 깨어있음

---

## 📞 다음 단계

배포 완료 후:
1. 백엔드 URL을 알려주세요
2. 프론트엔드 연결 도와드리겠습니다
3. 실제 동작 테스트 진행

---

## 💡 추가 정보

### Render vs AWS EC2
| 항목 | Render | AWS EC2 |
|------|--------|---------|
| 비용 | 무료 | $5-10/월 |
| 설정 | 5분 | 30분+ |
| 관리 | 자동 | 수동 |
| 성능 | 중간 | 높음 |
| 스케일링 | 자동 | 수동 |

**결론:** MVP/테스트는 Render, 상용은 AWS

---

이제 시작하세요! 각 단계마다 스크린샷을 공유해주시면 즉시 도와드리겠습니다. 🚀
