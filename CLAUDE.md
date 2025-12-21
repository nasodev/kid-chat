# Kid Chat

가족용 실시간 채팅 웹 애플리케이션

## 기술 스택

- **Frontend**: Vite + TypeScript (프레임워크 없음)
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, FCM)
- **Runtime**: Node.js 20

## 프로젝트 구조

```
kid-chat/
├── src/
│   ├── firebase/
│   │   ├── config.ts      # Firebase 초기화
│   │   ├── auth.ts        # 인증 (login, logout, signup)
│   │   ├── chat.ts        # 채팅 (메시지 CRUD)
│   │   └── fcm.ts         # 푸시 알림
│   ├── types/
│   │   └── index.ts       # 타입 정의
│   ├── utils/
│   │   └── helpers.ts     # 유틸리티 함수
│   ├── main.ts            # 진입점
│   ├── styles.css         # 스타일
│   └── vite-env.d.ts      # Vite 타입 선언
├── public/
│   ├── firebase-messaging-sw.js  # FCM 서비스 워커
│   └── img/                      # 이미지
├── functions/
│   └── index.js           # Cloud Functions (푸시 알림 전송)
├── index.html             # HTML 진입점
├── firestore.rules        # Firestore 보안 규칙
├── firebase.json          # Firebase 설정
├── vite.config.ts         # Vite 설정
└── tsconfig.json          # TypeScript 설정
```

## 명령어

```bash
# 개발 서버
npm run dev

# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# Cloud Functions 배포
cd functions && npm run deploy

# Cloud Functions 로그
cd functions && npm run logs
```

## Path Alias

`@/*` → `src/*` (예: `@/firebase/auth`)

## 주요 타입

- `ChatUser`: 사용자 (uid, name, email)
- `Message`: 메시지 (id, uid, name, text, createdAt)
- `NameColorClass`: 사용자별 색상 클래스

## Firebase 구조

### Firestore Collections

- `messages`: 채팅 메시지
- `fcmTokens`: FCM 푸시 토큰

### Security Rules

- 메시지 읽기/쓰기: 인증된 사용자만
- 메시지 삭제: 본인만
- FCM 토큰: 본인만

## 주의사항

- Firebase 클라이언트 설정은 공개 가능 (보안은 Security Rules가 담당)
- `functions/node_modules/`는 별도 관리 (`cd functions && npm install`)
