# 🔧 환경 변수 설정

## 추가해야 할 환경 변수

### 1️⃣ PYTHON_VERSION

**NAME_OF_VARIABLE:** `PYTHON_VERSION`  
**value:** `3.11.0`

---

### 2️⃣ ALLOWED_ORIGINS

**NAME_OF_VARIABLE:** `ALLOWED_ORIGINS`  
**value:** `https://sunpathshadowsimulator.vercel.app,http://localhost:3000`

---

### 3️⃣ CACHE_ADMIN_TOKEN (권장)

**NAME_OF_VARIABLE:** `CACHE_ADMIN_TOKEN`  
**value:** (강력한 임의 문자열)  
**용도:** `POST /api/cache/clear` 시 헤더 `X-Cache-Admin-Token` 과 일치해야 함. 미설정 시 clear는 403.

---

## 📝 입력 방법

### 첫 번째 환경 변수:
1. **NAME_OF_VARIABLE** 필드에: `PYTHON_VERSION`
2. **value** 필드에: `3.11.0`
3. **"+ Add Environment Variable"** 클릭

### 두 번째 환경 변수:
1. **NAME_OF_VARIABLE** 필드에: `ALLOWED_ORIGINS`
2. **value** 필드에: `https://sunpathshadowsimulator.vercel.app,http://localhost:3000`

---

## ✅ 완료 후

환경 변수 추가 완료되면:
1. **"Deploy Web Service"** 버튼 클릭
2. 배포 시작! 🚀

3-5분 후 완료됩니다!
