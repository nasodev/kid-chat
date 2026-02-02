import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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

// Firebase 초기화
export const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
