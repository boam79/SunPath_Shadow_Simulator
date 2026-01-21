# 백엔드 대안 솔루션 - 긴급 대응

**작성일:** 2026-01-21  
**상황:** AWS EC2 서버 완전 다운 (Ping 실패, 모든 포트 타임아웃)

---

## 🚨 현재 상황

### EC2 서버 상태
- **IP:** 54.180.251.93
- **Ping 응답:** ❌ 100% 패킷 손실
- **포트 80/443/8000:** ❌ 모두 타임아웃
- **예상 원인:**
  1. 인스턴스 중지됨
  2. 보안 그룹 규칙 변경
  3. 네트워크 ACL 차단
  4. 인스턴스 크래시/재부팅 중

---

## 💡 즉시 실행 가능한 대안 (우선순위 순)

### 🥇 대안 1: Vercel + 로컬 백엔드 (가장 빠름)
**소요 시간:** 5분  
**비용:** 무료

프론트엔드는 Vercel에 배포하고, 백엔드는 로컬에서 ngrok로 터널링

```bash
# 1. ngrok 설치 (없으면)
brew install ngrok
# 또는: https://ngrok.com/download

# 2. 로컬 백엔드 실행 (이미 실행 중)
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator/backend
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# 3. ngrok으로 외부 공개
ngrok http 8001
# 출력 예시: https://abc123.ngrok.io -> http://localhost:8001

# 4. 프론트엔드 환경변수 설정
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://abc123.ngrok.io" > .env.local

# 5. Vercel 배포
npx vercel --prod
```

**장점:**
- ✅ 5분 내 배포 가능
- ✅ 무료
- ✅ HTTPS 자동 지원
- ✅ 빠른 프론트엔드 (Vercel CDN)

**단점:**
- ⚠️ ngrok 무료 플랜은 세션 제한 (8시간)
- ⚠️ 로컬 컴퓨터가 켜져있어야 함

---

### 🥈 대안 2: Render.com (완전 무료)
**소요 시간:** 10-15분  
**비용:** 무료 (단, 콜드 스타트 있음)

Render는 GitHub 연동으로 자동 배포되며, 무료 플랜 제공

```bash
# 1. GitHub에 코드 푸시 (이미 되어있음)
git add .
git commit -m "Deploy to Render"
git push origin master

# 2. Render.com 웹사이트에서 설정
# - https://render.com → Sign Up (GitHub 연동)
# - New → Web Service
# - Repository: SunPath_Shadow_Simulator 선택
# - Root Directory: backend
# - Build Command: pip install -r requirements.txt
# - Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# - Environment: Python 3.11

# 3. 환경 변수 추가 (Render 대시보드에서)
ALLOWED_ORIGINS=https://sunpath-simulator.vercel.app
REDIS_URL=redis://무료Redis서비스URL (선택사항)

# 4. 프론트엔드를 Vercel에 배포
cd frontend
echo "NEXT_PUBLIC_API_URL=https://your-app.onrender.com" > .env.local
npx vercel --prod
```

**장점:**
- ✅ 완전 무료
- ✅ 자동 배포 (Git push만 하면 됨)
- ✅ HTTPS 자동
- ✅ 24/7 가동

**단점:**
- ⚠️ 무료 플랜은 15분 비활성화 시 슬립 (첫 요청 시 콜드 스타트 30초)

**상세 가이드:** https://render.com/docs/deploy-fastapi

---

### 🥉 대안 3: Railway.app (부분 무료)
**소요 시간:** 10분  
**비용:** $5 크레딧/월 무료

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli
# 또는: brew install railway

# 2. 로그인 및 프로젝트 생성
railway login
railway init

# 3. 백엔드 배포
cd backend
railway up

# 4. 도메인 설정 (Railway 대시보드)
# Settings → Generate Domain → https://your-app.up.railway.app

# 5. 프론트엔드 Vercel 배포
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://your-app.up.railway.app" > .env.local
npx vercel --prod
```

**장점:**
- ✅ 빠른 배포
- ✅ 콜드 스타트 없음
- ✅ PostgreSQL, Redis 무료 포함

**단점:**
- ⚠️ $5 초과 시 과금

---

### 🔧 대안 4: Fly.io (무료 티어)
**소요 시간:** 15분  
**비용:** 무료 (3개 VM까지)

```bash
# 1. Fly CLI 설치
brew install flyctl
# 또는: curl -L https://fly.io/install.sh | sh

# 2. 로그인
flyctl auth login

# 3. Dockerfile 생성 (이미 있으면 스킵)
cd backend
cat > Dockerfile << 'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

# 4. 배포
flyctl launch
# 대화형으로 설정:
# - App name: sunpath-backend
# - Region: Tokyo (nrt)
# - Postgres/Redis: No (일단 스킵)

flyctl deploy

# 5. 프론트엔드 연결
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://sunpath-backend.fly.dev" > .env.local
npx vercel --prod
```

**장점:**
- ✅ 무료 티어 충분함
- ✅ 글로벌 엣지 배포
- ✅ 빠른 성능

---

### 🏢 대안 5: AWS Lambda + API Gateway (서버리스)
**소요 시간:** 30분  
**비용:** 거의 무료 (월 100만 요청까지)

FastAPI를 Mangum으로 Lambda 호환 변환

```bash
# 1. Mangum 설치
cd backend
./venv/bin/pip install mangum

# 2. Lambda 핸들러 생성
cat > lambda_handler.py << 'EOF'
from mangum import Mangum
from app.main import app

handler = Mangum(app)
EOF

# 3. 배포 (AWS SAM 또는 Serverless Framework)
# Serverless Framework 사용 예시:
npm install -g serverless
serverless create --template aws-python3 --path sunpath-lambda

# serverless.yml 설정 후:
serverless deploy --stage prod
```

**장점:**
- ✅ 무한 확장
- ✅ 사용한 만큼만 과금
- ✅ AWS 네이티브

**단점:**
- ⚠️ 콜드 스타트 (2-5초)
- ⚠️ 설정 복잡

---

## 📊 대안 비교표

| 대안 | 배포 시간 | 비용 | 성능 | 안정성 | 복잡도 |
|------|----------|------|------|--------|--------|
| **Vercel + ngrok** | 5분 | 무료 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ (매우 쉬움) |
| **Render** | 15분 | 무료 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (쉬움) |
| **Railway** | 10분 | $5/월 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (쉬움) |
| **Fly.io** | 15분 | 무료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ (중간) |
| **AWS Lambda** | 30분 | 무료 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (어려움) |

---

## 🎯 추천: 상황별 최적 대안

### 🔥 지금 당장 서비스해야 한다면
→ **대안 1: Vercel + ngrok** (5분 완료)

### 💰 완전 무료로 장기 운영
→ **대안 2: Render.com** (콜드 스타트 감수)

### ⚡ 빠르고 안정적인 무료 서비스
→ **대안 4: Fly.io**

### 🏢 상용 서비스 준비
→ **대안 3: Railway** 또는 **대안 5: AWS Lambda**

---

## 🚀 즉시 실행 스크립트 (대안 1)

```bash
#!/bin/bash
# 파일명: deploy-quick.sh
# 사용법: ./deploy-quick.sh

set -e

echo "🚀 빠른 배포 시작..."

# 1. 백엔드 실행 확인
echo "📡 백엔드 상태 확인..."
if ! curl -s http://localhost:8001/health > /dev/null; then
    echo "❌ 백엔드가 실행되지 않았습니다."
    echo "다음 명령으로 실행하세요:"
    echo "cd backend && ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"
    exit 1
fi
echo "✅ 백엔드 정상"

# 2. ngrok 설치 확인
if ! command -v ngrok &> /dev/null; then
    echo "📥 ngrok 설치 중..."
    brew install ngrok
fi

# 3. ngrok 터널 시작
echo "🌐 ngrok 터널 생성 중..."
ngrok http 8001 > /dev/null &
NGROK_PID=$!
sleep 3

# 4. ngrok URL 가져오기
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import json,sys;print(json.load(sys.stdin)['tunnels'][0]['public_url'])")
echo "✅ 백엔드 공개 URL: $NGROK_URL"

# 5. 프론트엔드 환경변수 설정
cd frontend
echo "NEXT_PUBLIC_API_URL=$NGROK_URL" > .env.local
echo "✅ 프론트엔드 환경변수 설정 완료"

# 6. Vercel 배포
echo "🚀 Vercel 배포 중..."
npx vercel --prod

echo ""
echo "✅ 배포 완료!"
echo "📝 ngrok 터널 PID: $NGROK_PID"
echo "📝 중지하려면: kill $NGROK_PID"
```

실행 방법:
```bash
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator
chmod +x deploy-quick.sh
./deploy-quick.sh
```

---

## 🔍 AWS EC2 복구 방법 (병행 추진)

서비스는 대안으로 유지하면서, AWS는 별도로 복구:

### 1. AWS 콘솔에서 확인할 사항
- EC2 대시보드 → 인스턴스 상태 (stopped/running?)
- System Status Checks / Instance Status Checks
- 보안 그룹 인바운드 규칙 (80, 443 포트 열려있는지)
- Elastic IP 연결 상태

### 2. AWS Systems Manager로 접속 시도
```bash
# AWS CLI 설치 및 설정
brew install awscli
aws configure

# Session Manager로 연결
aws ssm start-session --target i-030a6f1fd19110d16 --region ap-northeast-2

# 연결되면:
sudo systemctl status sunpath-backend
sudo journalctl -u sunpath-backend -n 100
```

### 3. 인스턴스 재시작
AWS 콘솔에서:
1. EC2 → 인스턴스 선택
2. Instance State → Reboot
3. 또는 Stop → Start (IP 변경될 수 있음)

---

## 📞 즉시 도움이 필요하다면

각 대안별로 상세 설정을 도와드릴 수 있습니다:
- "대안 1로 진행" → ngrok + Vercel 설정 지원
- "대안 2로 진행" → Render.com 설정 지원
- "AWS 복구 우선" → Systems Manager 접속 지원
- "모두 병행" → 전체 프로세스 안내

어떤 대안을 선택하시겠습니까?
