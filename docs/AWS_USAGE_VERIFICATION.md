# AWS 사용 확인 방법

이 문서는 현재 백엔드가 AWS EC2를 사용하고 있는지 확인하는 다양한 방법을 안내합니다.

## 1. Vercel 환경변수 확인 (가장 확실한 방법)

### 방법
1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. `SunPath_Shadow_Simulator` 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 사이드바에서 **Environment Variables** 클릭
5. `NEXT_PUBLIC_API_URL` 환경변수 확인

### 확인 사항
- **AWS 사용 중**: `http://54.180.251.93` 또는 `http://54.180.251.93:8000`
- **Render 사용 중**: `https://sunpath-api.onrender.com`

## 2. 브라우저 개발자 도구로 확인 (실시간 확인)

### 방법
1. 프론트엔드 접속: https://sunpathshadowsimulator.vercel.app
2. **F12** 또는 **우클릭 → 검사**로 개발자 도구 열기
3. **Network** 탭 선택
4. 위치 입력 및 계산 실행
5. API 요청 확인

### 확인 사항

#### AWS 사용 중인 경우:
- **요청 URL**: `/api/proxy/api/integrated/calculate` (프록시 경로)
- 또는 직접 요청: `http://54.180.251.93/api/integrated/calculate`
- **응답 상태**: 200 OK
- **응답 시간**: 약 100-200ms (일관성 있음)

#### Render 사용 중인 경우:
- **요청 URL**: `https://sunpath-api.onrender.com/api/integrated/calculate`
- **응답 시간**: 첫 요청 시 15초 이상 (Cold Start)

### Network 탭에서 확인할 수 있는 정보:
```
Request URL: https://sunpathshadowsimulator.vercel.app/api/proxy/api/integrated/calculate
Request Method: POST
Status Code: 200 OK
Remote Address: 54.180.251.93:80 (AWS EC2)
```

## 3. 백엔드 직접 접근 테스트

### Health Check 엔드포인트
```bash
curl http://54.180.251.93/health
```
**예상 응답:**
```json
{"status":"healthy","service":"sunpath-api"}
```

### API 문서 접근
브라우저에서 다음 URL 접속:
- http://54.180.251.93/docs (Swagger UI)
- http://54.180.251.93/redoc (ReDoc)

### API 테스트
```bash
curl -X POST http://54.180.251.93/api/integrated/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 37.5665, "lon": 126.9780},
    "datetime": {"date": "2025-11-11", "start_time": "00:00", "end_time": "23:59", "interval": 60},
    "object": {"height": 10}
  }'
```

## 4. AWS EC2 콘솔에서 확인

### 방법
1. [AWS Management Console](https://aws.amazon.com/console/) 접속
2. **EC2** 서비스 선택
3. 왼쪽 메뉴에서 **Instances** 클릭
4. 인스턴스 목록에서 다음 정보 확인:
   - **Instance ID**: `i-...`
   - **Public IPv4 address**: `54.180.251.93`
   - **State**: `running`
   - **Instance type**: `t3.micro`
   - **Key pair name**: `boam79-aws-key`

### 확인 사항
- 인스턴스 상태가 **running**인지 확인
- 퍼블릭 IP가 `54.180.251.93`인지 확인
- 보안 그룹에 포트 80, 8000이 열려있는지 확인

## 5. EC2 인스턴스에 직접 접속하여 확인

### SSH 접속
```bash
ssh -i boam79-aws-key.pem ubuntu@54.180.251.93
```

### Docker 컨테이너 확인
```bash
cd ~/sunpath-backend
docker compose ps
```

**예상 출력:**
```
NAME              IMAGE                     STATUS
sunpath-backend   sunpath-backend-backend   Up X minutes (healthy)
sunpath-redis     redis:7-alpine            Up X minutes (healthy)
```

### 서비스 로그 확인
```bash
# 백엔드 로그
docker compose logs backend --tail 50

# Systemd 서비스 상태
sudo systemctl status sunpath-backend.service
```

## 6. 프론트엔드 소스 코드 확인

### 로컬에서 확인
```bash
# 환경변수 파일 확인 (로컬 개발용)
cat frontend/.env.local 2>/dev/null || echo "No .env.local file"

# API 클라이언트 코드 확인
grep -n "API_BASE_URL\|NEXT_PUBLIC_API_URL" frontend/lib/api.ts
```

### Vercel 빌드 로그 확인
1. Vercel 대시보드 → 프로젝트 선택
2. **Deployments** 탭
3. 최신 배포 클릭
4. **Build Logs** 확인
5. 환경변수 `NEXT_PUBLIC_API_URL` 값 확인

## 7. 성능 차이로 확인

### AWS EC2 (현재)
- **Cold Start**: 없음 (항상 실행)
- **응답 시간**: 약 100-200ms (일관성 있음)
- **가용성**: 24/7 실행

### Render (이전)
- **Cold Start**: 있음 (무료 티어, 15초 이상)
- **응답 시간**: Cold start 후 약 500ms
- **가용성**: 무료 티어 제한

### 확인 방법
1. 프론트엔드에서 위치 입력 및 계산 실행
2. 개발자 도구 → Network 탭에서 응답 시간 확인
3. 첫 요청이 빠르면 (1초 이내) → AWS
4. 첫 요청이 느리면 (15초 이상) → Render (Cold Start)

## 8. API 응답 헤더 확인

### 방법
브라우저 개발자 도구 → Network 탭 → API 요청 클릭 → Headers 탭

### AWS 사용 중인 경우:
```
Request URL: https://sunpathshadowsimulator.vercel.app/api/proxy/api/integrated/calculate
Remote Address: 54.180.251.93:80
Server: nginx/1.18.0 (Ubuntu)
```

### Render 사용 중인 경우:
```
Request URL: https://sunpath-api.onrender.com/api/integrated/calculate
Remote Address: (Render 서버 IP)
Server: (Render 서버 정보)
```

## 9. 빠른 확인 스크립트

### 로컬에서 실행
```bash
# Health Check
curl -s http://54.180.251.93/health && echo " ✅ AWS 백엔드 응답"

# API 테스트
curl -s -X POST http://54.180.251.93/api/integrated/calculate \
  -H "Content-Type: application/json" \
  -d '{"location":{"lat":37.5665,"lon":126.9780},"datetime":{"date":"2025-11-11","start_time":"00:00","end_time":"23:59","interval":60},"object":{"height":10}}' \
  | python3 -m json.tool | head -5 && echo " ✅ AWS 백엔드 API 정상 작동"
```

## 10. 종합 확인 체크리스트

- [ ] Vercel 환경변수 `NEXT_PUBLIC_API_URL`이 `http://54.180.251.93`인지 확인
- [ ] 브라우저 Network 탭에서 API 요청이 `/api/proxy/...` 또는 `http://54.180.251.93/...`로 가는지 확인
- [ ] `http://54.180.251.93/health` 접속 시 정상 응답 확인
- [ ] `http://54.180.251.93/docs` 접속 시 Swagger UI 표시 확인
- [ ] AWS EC2 콘솔에서 인스턴스가 running 상태인지 확인
- [ ] 프론트엔드에서 계산 실행 시 빠른 응답 시간 확인 (1초 이내)
- [ ] "Failed to fetch" 오류 없이 정상 작동 확인

## 문제 해결

### AWS를 사용 중인데 Render로 요청이 가는 경우
1. Vercel 환경변수 확인 및 업데이트
2. 프론트엔드 재배포
3. 브라우저 캐시 삭제 후 재시도

### AWS 백엔드가 응답하지 않는 경우
1. EC2 인스턴스 상태 확인 (AWS Console)
2. 보안 그룹 규칙 확인 (포트 80, 8000)
3. Docker 컨테이너 상태 확인 (SSH 접속)
4. Nginx 서비스 상태 확인

## 참고

- AWS EC2 퍼블릭 IP: `54.180.251.93`
- Render 백엔드 URL: `https://sunpath-api.onrender.com` (이전)
- 프론트엔드 URL: `https://sunpathshadowsimulator.vercel.app`

