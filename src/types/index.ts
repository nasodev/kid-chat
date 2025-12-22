// Firebase 관련 타입
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// 사용자 관련 타입
export interface ChatUser {
  uid: string;
  name: string;
  email: string;
}

// 메시지 관련 타입
export interface Message {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: Date | null;
}

// Firestore 메시지 데이터 (서버 타임스탬프 포함)
export interface MessageData {
  uid: string;
  name: string;
  text: string;
  createdAt: {
    toDate: () => Date;
  } | null;
}

// 이름별 색상 클래스
export type NameColorClass =
  | 'color-nayoon'
  | 'color-soyoon'
  | 'color-parent1'
  | 'color-parent2'
  | 'color-parent3'
  | 'color-ai-mallangi'   // 말랑이 (다정한 친구)
  | 'color-ai-lupin'      // 루팡 (건방진 친구)
  | 'color-ai-pudding'    // 푸딩 (애완동물)
  | 'color-ai-michael';   // 마이콜 (영어선생님)
