import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUser, getCurrentUserName } from './auth';
import type { MessageData } from '@/types';

/**
 * 메시지 실시간 구독
 */
export function subscribeToMessages(
  callback: (snapshot: QuerySnapshot<DocumentData>) => void
): Unsubscribe {
  const q = query(
    collection(db, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, callback);
}

/**
 * 메시지 전송
 */
export async function sendMessage(text: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("먼저 로그인하세요.");
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  const name = getCurrentUserName();

  await addDoc(collection(db, "messages"), {
    uid: user.uid,
    name: name,
    text: trimmedText,
    createdAt: serverTimestamp()
  });
}

/**
 * 메시지 삭제
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await deleteDoc(doc(db, "messages", messageId));
}

/**
 * AI 응답 메시지 전송
 */
export async function sendAIMessage(text: string): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    return;
  }

  await addDoc(collection(db, "messages"), {
    uid: "AI",
    name: "AI",
    text: trimmedText,
    createdAt: serverTimestamp()
  });
}

/**
 * 메시지 데이터 파싱
 */
export function parseMessageData(docId: string, data: DocumentData): {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: Date | null;
} {
  const messageData = data as MessageData;
  return {
    id: docId,
    uid: messageData.uid,
    name: messageData.name || "알 수 없음",
    text: messageData.text || "",
    createdAt: messageData.createdAt?.toDate() ?? null
  };
}
