# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 인자 (GitHub Actions에서 전달)
ARG VITE_AI_SERVER_URL=https://api.funq.kr
ENV VITE_AI_SERVER_URL=$VITE_AI_SERVER_URL

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
