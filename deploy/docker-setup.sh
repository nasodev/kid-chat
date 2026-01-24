#!/bin/bash
# 서버 초기 설정 스크립트
# 프로덕션 서버에서 최초 1회 실행

set -e

echo "=== Kid-Chat Docker 초기 설정 ==="

# 1. Docker 네트워크 확인
if ! docker network ls | grep -q "funq-network"; then
    echo "Creating funq-network..."
    docker network create funq-network
else
    echo "funq-network already exists"
fi

# 2. 설정 디렉토리 생성
CONFIG_DIR="/home/funq/dev/config/kid-chat"
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Creating config directory..."
    mkdir -p "$CONFIG_DIR"
fi

# 3. .env.prod 템플릿 생성
ENV_FILE="$CONFIG_DIR/.env.prod"
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env.prod template..."
    cat > "$ENV_FILE" << 'EOF'
VITE_AI_SERVER_URL=https://api.funq.kr
EOF
    echo "Created $ENV_FILE"
else
    echo ".env.prod already exists"
fi

echo ""
echo "=== 설정 완료 ==="
echo ""
echo "다음 단계:"
echo "1. GitHub Secrets 설정:"
echo "   - SSH_HOST, SSH_USER, SSH_KEY, SSH_PORT"
echo "   - GHCR_TOKEN (read:packages 권한)"
echo "   - VITE_AI_SERVER_URL"
