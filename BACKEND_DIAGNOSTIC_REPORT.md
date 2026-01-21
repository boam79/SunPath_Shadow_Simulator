# 백엔드 문제 진단 및 해결 보고서

**작성일:** 2026-01-21  
**상태:** ✅ 로컬 백엔드 해결 완료, AWS 백엔드 접근 방법 제시

---

## 🔍 발견된 문제

### 1. 로컬 백엔드 문제

#### 문제: Python 3.14 호환성 이슈
- **증상**: `pydantic-core` 빌드 실패
- **원인**: Python 3.14가 너무 최신 버전이라 PyO3가 지원하지 않음 (최대 3.13까지 지원)
- **에러 메시지**:
```
error: the configured Python interpreter version (3.14) is newer than PyO3's maximum supported version (3.13)
```

#### 해결 방법: Python 3.11 사용
```bash
# 기존 가상환경 삭제
cd backend
rm -rf venv

# Python 3.11로 가상환경 재생성
python3.11 -m venv venv

# 의존성 설치
./venv/bin/pip install -r requirements.txt

# 백엔드 실행 (포트 8001)
./venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

#### 결과: ✅ 성공
```json
{
  "status": "healthy",
  "service": "sunpath-api"
}
```

**백엔드 엔드포인트:**
- Health Check: http://localhost:8001/health
- API Root: http://localhost:8001/
- API Docs: http://localhost:8001/docs

---

### 2. AWS EC2 백엔드 접근 문제

#### 문제: SSH 키 파일 분실
- **증상**: `boam79-aws-key.pem` 파일을 찾을 수 없음
- **영향**: EC2 인스턴스 (`54.180.251.93`)에 SSH로 접속 불가

#### 해결 방안 (3가지 옵션)

##### 옵션 A: AWS Systems Manager Session Manager (추천 ⭐)
가장 안전하고 현대적인 방법입니다.

**장점:**
- ✅ SSH 키 불필요
- ✅ 포트 22 개방 불필요
- ✅ IAM 기반 인증 및 권한 관리
- ✅ 완전한 감사 로그 (CloudWatch, CloudTrail)
- ✅ 프라이빗 IP만 있어도 접속 가능

**설정 단계:**

1. **EC2 인스턴스에 IAM 역할 할당**
   ```bash
   # AWS 콘솔에서:
   # EC2 > 인스턴스 > i-030a6f1fd19110d16 선택
   # Actions > Security > Modify IAM role
   # 역할: AmazonSSMManagedInstanceCore 권한 포함
   ```

2. **SSM Agent 확인 (Ubuntu 22.04는 기본 설치됨)**
   ```bash
   # Session Manager 콘솔에서 연결 시도
   # 또는 AWS CLI:
   aws ssm start-session --target i-030a6f1fd19110d16 --region ap-northeast-2
   ```

3. **백엔드 서비스 상태 확인**
   ```bash
   sudo systemctl status sunpath-backend
   sudo journalctl -u sunpath-backend -n 50
   ```

**참고 문서:**
- https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html

---

##### 옵션 B: EC2 Instance Connect
일회성 SSH 키를 생성하여 60초간 사용 가능합니다.

**단계:**
```bash
# 공개키 푸시 (AWS CLI)
aws ec2-instance-connect send-ssh-public-key \
    --instance-id i-030a6f1fd19110d16 \
    --instance-os-user ubuntu \
    --ssh-public-key file://~/.ssh/id_rsa.pub \
    --region ap-northeast-2

# 60초 이내에 SSH 연결
ssh ubuntu@54.180.251.93
```

**제약사항:**
- 포트 22가 보안 그룹에서 허용되어야 함
- 60초 시간 제한

---

##### 옵션 C: 키 복구 (마지막 수단)
EC2 인스턴스를 중지하고 루트 볼륨을 분리하여 다른 인스턴스에 마운트 후 `authorized_keys` 수정

**주의:** 서비스 다운타임 발생

---

## 📊 현재 상태

### 로컬 환경
| 항목 | 상태 | 포트 | URL |
|------|------|------|-----|
| Frontend (Next.js) | ❓ 미확인 | 3000 | http://localhost:3000 |
| Backend (FastAPI) | ✅ 정상 | 8001 | http://localhost:8001 |
| Redis | ⚠️ 미설치 | 6379 | 선택사항 (캐싱용) |

### AWS EC2 환경
| 항목 | 상태 | 정보 |
|------|------|------|
| 인스턴스 ID | `i-030a6f1fd19110d16` | - |
| Public IP | `54.180.251.93` | - |
| 인스턴스 타입 | `t3.micro` | - |
| OS | Ubuntu 22.04 LTS | - |
| SSH 접근 | ❌ 키 분실 | Session Manager 사용 권장 |
| 백엔드 서비스 | ❓ 미확인 | `sunpath-backend.service` |
| Nginx | ❓ 미확인 | 80/443 포트 |

---

## 🎯 즉시 실행 가능한 액션

### 1. 로컬 개발 재개
```bash
# 터미널 1: 백엔드 실행
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator/backend
./venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# 터미널 2: 프론트엔드 실행
cd /Users/parkjaemin/Documents/개발프로젝트/git/SunPath_Shadow_Simulator/frontend
npm run dev

# 접속: http://localhost:3000
```

### 2. 프론트엔드 API 엔드포인트 수정
`frontend/.env.local` 파일 생성 또는 수정:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### 3. AWS 백엔드 상태 확인
```bash
# AWS 콘솔에서 Systems Manager Session Manager 사용
# 또는 AWS CLI:
aws ssm start-session --target i-030a6f1fd19110d16 --region ap-northeast-2

# 연결 후:
sudo systemctl status sunpath-backend
curl http://localhost:8000/health
```

---

## 💡 추가 제안

### Docker Compose 사용 (권장)
로컬 환경을 더 쉽게 관리하려면:

```bash
# 프로젝트 루트에서
docker-compose up -d

# 서비스 확인
docker-compose ps

# 로그 확인
docker-compose logs -f backend
```

**필요 사항:**
- Docker Desktop 설치: https://www.docker.com/products/docker-desktop

---

## 🔧 장기 해결책

1. **Python 버전 고정**
   - `requirements.txt`에 Python 버전 명시: `python-version==3.11`
   - `.python-version` 파일 생성 (pyenv 사용 시)

2. **환경 변수 관리**
   - `.env.example` 파일 생성 및 문서화
   - 로컬/개발/프로덕션 환경별 설정 분리

3. **AWS 키 관리**
   - AWS Secrets Manager에 SSH 키 백업
   - Session Manager로 전환 (키 관리 불필요)

4. **모니터링 강화**
   - CloudWatch 알람 설정
   - Healthcheck 엔드포인트 정기 모니터링

---

## 📝 체크리스트

### 즉시 해야 할 일
- [ ] AWS Systems Manager IAM 역할 할당
- [ ] Session Manager로 EC2 접속 테스트
- [ ] 백엔드 서비스 상태 확인
- [ ] 프론트엔드 API URL 수정
- [ ] 로컬 전체 스택 테스트

### 나중에 할 일
- [ ] Docker Compose 설정 완성
- [ ] Redis 캐시 레이어 활성화
- [ ] CI/CD 파이프라인 검증
- [ ] 프로덕션 모니터링 설정

---

**작성자:** AI Assistant  
**문의:** 추가 도움이 필요하면 언제든지 요청하세요!
