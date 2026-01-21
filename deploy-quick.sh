#!/bin/bash
# 빠른 배포 스크립트

set -e
echo "🚀 빠른 배포 시작..."

# 백엔드 확인
echo "📡 백엔드 상태 확인..."
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo "❌ 백엔드가 실행되지 않았습니다."
    exit 1
fi
echo "✅ 백엔드 정상 (포트 8001)"

echo ""
echo "선택 가능한 옵션:"
echo "1) ngrok + Vercel (5분, 무료, 즉시 사용)"
echo "2) Render.com (15분, 무료, 영구 사용)"
echo "3) Railway.app (10분, $5/월)"
echo ""
echo "추천: 지금 당장 → 옵션 1, 장기 운영 → 옵션 2"
