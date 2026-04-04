#!/usr/bin/env bash
# 프로덕션 백엔드(Render) 및 레거시 AWS EC2 가동 여부 확인
set -euo pipefail

RENDER_URL="${RENDER_BACKEND_URL:-https://sunpath-shadow-simulator.onrender.com}"
AWS_URL="${AWS_BACKEND_URL:-http://54.180.251.93}"
CURL_RENDER_TIMEOUT="${CURL_RENDER_TIMEOUT:-120}"

echo "=== Render (프로덕션) ==="
echo "GET $RENDER_URL/health (timeout ${CURL_RENDER_TIMEOUT}s, 콜드 스타트 대비)"
if code=$(curl -sS -m "$CURL_RENDER_TIMEOUT" -o /tmp/sunpath-health-render.json -w "%{http_code}" "$RENDER_URL/health"); then
  if [[ "$code" == "200" ]]; then
    echo "   ✅ HTTP $code — $(cat /tmp/sunpath-health-render.json)"
  else
    echo "   ⚠️ HTTP $code — body: $(cat /tmp/sunpath-health-render.json 2>/dev/null || true)"
  fi
else
  echo "   ❌ 요청 실패 (타임아웃 또는 네트워크)"
fi

echo ""
echo "=== AWS EC2 (레거시, v0.1.12) ==="
echo "GET $AWS_URL/health (timeout 15s)"
if code=$(curl -sS -m 15 -o /tmp/sunpath-health-aws.json -w "%{http_code}" "$AWS_URL/health" 2>/dev/null); then
  if [[ "$code" == "200" ]]; then
    echo "   ✅ HTTP $code — $(cat /tmp/sunpath-health-aws.json)"
  else
    echo "   ⚠️ HTTP $code"
  fi
else
  echo "   ❌ 응답 없음 (다운 또는 방화벽) — 프로덕션은 Render 사용 권장"
fi

echo ""
echo "Vercel 프론트: NEXT_PUBLIC_API_URL=$RENDER_URL 로 맞추세요."
