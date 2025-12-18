import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';
import type { FirebaseConfig } from '@/types';

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDxtXl0mnUpaMhkTPhlbYVr9o49oX7sJks",
  authDomain: "kid-chat-2ca0f.firebaseapp.com",
  projectId: "kid-chat-2ca0f",
  storageBucket: "kid-chat-2ca0f.firebasestorage.app",
  messagingSenderId: "1097422182914",
  appId: "1:1097422182914:web:cb798a95684b0b0c39e51b",
  measurementId: "G-YSWET2DE8E"
};

// FCM VAPID 키
export const VAPID_KEY = "BLNlqNJGcywRq7ytgTPCKk20lIYpTx4-vrYvaOpUVr-yHr46oAuEsRippBPSEvTqb1qEHYdjvQwKnLr7a-ieEBY";

// Firebase 초기화
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// FCM은 브라우저 지원 확인 후 초기화
export function getMessagingInstance(): Messaging | null {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("푸시 알림이 지원되지 않는 브라우저입니다.");
    return null;
  }
  return getMessaging(app);
}
