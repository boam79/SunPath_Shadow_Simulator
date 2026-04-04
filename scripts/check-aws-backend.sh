#!/usr/bin/env bash
# 레거시 파일명 유지: 과거에는 AWS EC2만 검사했습니다.
# 프로덕션은 Render를 사용하므로 통합 스크립트로 위임합니다.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/check-backend-production.sh"
