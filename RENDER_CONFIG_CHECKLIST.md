# ✅ Render 설정 체크리스트

현재 화면에서 다음을 수정하세요:

## 🔧 수정 필요 (3곳)

### 1. Root Directory ⚠️ **가장 중요!**
**현재:** `e.g. src` (비어있음)  
**수정:** `backend` 입력

📍 **Root Directory 필드에 `backend` 입력하세요!**

---

### 2. Build Command ✅ (이미 맞음)
**현재:** `$ pip install -r requirements.txt`  
**상태:** ✅ 정확함!

---

### 3. Start Command ⚠️ **수정 필요!**
**현재:** `$ gunicorn your_application.wsgi`  
**수정:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

📍 **Start Command를 위 명령어로 바꾸세요!**

---

## ✅ 확인 필요

### 4. Branch ✅
**현재:** `master`  
**상태:** ✅ 정확함!

### 5. Region ✅
**현재:** `Singapore (Southeast Asia)`  
**상태:** ✅ 정확함!

### 6. Instance Type ✅
**선택:** `Free` (512 MB RAM, $0/month)  
**상태:** ✅ 정확함!

---

## 📋 최종 설정 값

아래와 같이 입력되어야 합니다:

```
Branch: master
Region: Singapore (Southeast Asia)
Root Directory: backend          ← 입력하세요!
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT  ← 수정하세요!
Instance Type: Free
```

---

## 🚀 다음 단계

1. **Root Directory** 필드에 `backend` 입력
2. **Start Command** 필드를 다음으로 교체:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. 아래로 스크롤
4. **환경 변수 추가** (Environment Variables)
5. 페이지 하단 **"Create Web Service"** 클릭

준비되면 스크린샷 다시 보내주세요! 📸
