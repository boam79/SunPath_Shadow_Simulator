#!/bin/bash
# AWS 백엔드 사용 확인 스크립트

echo "=== AWS 백엔드 사용 확인 ==="
echo ""

# 1. Health Check
echo "1. Health Check 테스트..."
HEALTH_RESPONSE=$(curl -s http://54.180.251.93/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "   ✅ AWS 백엔드 응답: $HEALTH_RESPONSE"
else
    echo "   ❌ AWS 백엔드 응답 없음"
    exit 1
fi

echo ""

# 2. API 문서 접근 확인
echo "2. API 문서 접근 확인..."
DOC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://54.180.251.93/docs)
if [ "$DOC_STATUS" = "200" ]; then
    echo "   ✅ API 문서 접근 가능 (HTTP $DOC_STATUS)"
else
    echo "   ⚠️  API 문서 접근 불가 (HTTP $DOC_STATUS)"
fi

echo ""

# 3. API 테스트
echo "3. API 통합 테스트..."
API_RESPONSE=$(curl -s -X POST http://54.180.251.93/api/integrated/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": 37.5665, "lon": 126.9780},
    "datetime": {"date": "2025-11-11", "start_time": "00:00", "end_time": "23:59", "interval": 60},
    "object": {"height": 10}
  }')

if echo "$API_RESPONSE" | grep -q "metadata"; then
    echo "   ✅ API 정상 작동"
    echo "   응답 요약: $(echo "$API_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Request ID: {data['metadata']['request_id']}, Series: {len(data['series'])} points\")" 2>/dev/null || echo "응답 확인됨")"
else
    echo "   ❌ API 오류: $API_RESPONSE"
fi

echo ""
echo "=== 확인 완료 ==="
echo ""
echo "📝 추가 확인 방법:"
echo "   1. Vercel 대시보드 → Settings → Environment Variables"
echo "   2. NEXT_PUBLIC_API_URL 값이 http://54.180.251.93 인지 확인"
echo "   3. 브라우저 개발자 도구 → Network 탭에서 API 요청 확인"
