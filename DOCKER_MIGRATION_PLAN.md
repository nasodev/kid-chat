# Docker 전환 가이드 (Vite 프로젝트용)

pm2 기반 Vite 프로젝트를 Docker로 전환하는 가이드.

---

## 1. 전환 전 확인사항

### 프로젝트 정보 파악
```bash
# package.json 확인 - 빌드 명령어, 포트
cat package.json

# 환경변수 확인
ls -la .env*
grep -r "import.meta.env" src/
```

### 체크리스트
- [ ] 빌드 명령어: `npm run build`
- [ ] 출력 폴더: `dist/`
- [ ] 환경변수: `VITE_*` 접두사 확인
- [ ] 현재 포트: pm2 실행 포트
- [ ] 로컬 포트: 23000번대 할당

---

## 2. 생성할 파일

### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 인자 (환경변수)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml (로컬 개발)
```yaml
services:
  app:
    build: .
    container_name: <프로젝트>-dev
    ports:
      - "<로컬포트>:80"
    restart: unless-stopped
```

### docker-compose.prod.yml (프로덕션)
```yaml
services:
  app:
    image: ghcr.io/<사용자>/<프로젝트>:${IMAGE_TAG:-latest}
    container_name: <프로젝트>
    restart: unless-stopped
    ports:
      - "127.0.0.1:<프로덕션포트>:80"
    networks:
      - funq-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  funq-network:
    external: true
```

### nginx.docker.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### .dockerignore
```
node_modules
dist
.git
.github
*.md
.env.local
```

### .env.local (로컬 개발)
```
VITE_API_URL=http://localhost:28000
```

---

## 3. 수정할 파일

### .gitignore 추가
```
docker-compose.override.yml
```

### .github/workflows/deploy.yml
pm2 → Docker 배포로 변경 (아래 템플릿 참고)

---

## 4. GitHub Actions 템플릿

```yaml
name: Deploy <프로젝트>

on:
  push:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          port: ${{ secrets.SSH_PORT }}
          script: |
            set -e
            cd /home/funq/dev/<프로젝트>
            git fetch origin main && git reset --hard origin/main
            echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker pull ghcr.io/${{ github.repository }}:latest

            # pm2 중지 (최초 전환 시)
            if command -v pm2 &> /dev/null && pm2 describe <프로젝트> &> /dev/null; then
              pm2 stop <프로젝트> || true
              pm2 delete <프로젝트> || true
            fi

            docker compose -f docker-compose.prod.yml down || true
            docker compose -f docker-compose.prod.yml up -d
            sleep 10
            curl -sf http://localhost:<포트> > /dev/null && echo "Success!" || exit 1
            docker image prune -f
```

---

## 5. 서버 설정

### 환경변수 파일 생성
```bash
mkdir -p /home/funq/dev/config/<프로젝트>
cat > /home/funq/dev/config/<프로젝트>/.env.prod << 'EOF'
VITE_API_URL=https://api.funq.kr
EOF
```

### pm2 중지 (수동)
```bash
pm2 stop <프로젝트>
pm2 delete <프로젝트>
pm2 save
```

---

## 6. GitHub Secrets 설정

| Secret | 값 | 비고 |
|--------|-----|------|
| `SSH_HOST` | 서버 IP/도메인 | |
| `SSH_USER` | funq | |
| `SSH_KEY` | SSH 개인키 | |
| `SSH_PORT` | 2222 | |
| `GHCR_TOKEN` | PAT | read:packages 권한 |
| `VITE_*` | 환경변수 | 프로젝트별 |

---

## 7. 로컬 포트 할당표

| 프로젝트 | 로컬 | 프로덕션 |
|----------|------|----------|
| blog-nextjs | 23001 | 3000 |
| cupstacking-timer | 23002 | 80 |
| kid-chat | 23003 | 3001 |
| calendar | 23004 | 3002 |
| backend-api | 28000 | 8000 |

---

## 8. 실행 순서 체크리스트

1. [ ] 프로젝트 정보 파악 (빌드, 환경변수)
2. [ ] Docker 파일 생성 (Dockerfile, compose, nginx, dockerignore)
3. [ ] .env.local 생성 (로컬 개발용)
4. [ ] 로컬 Docker 빌드 테스트: `docker compose up --build`
5. [ ] 접속 테스트: `curl http://localhost:<포트>`
6. [ ] deploy.yml 수정
7. [ ] .gitignore 업데이트
8. [ ] 커밋 및 푸시
9. [ ] GitHub Secrets 설정
10. [ ] 서버 .env.prod 생성
11. [ ] 서버 pm2 중지
12. [ ] GitHub Actions 배포 확인
