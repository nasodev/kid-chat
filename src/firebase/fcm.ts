import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, VAPID_KEY, getMessagingInstance } from './config';

let messaging: Messaging | null = null;
let fcmTokenSaved = false;

/**
 * FCM 초기화
 */
export async function initFCM(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("푸시 알림이 지원되지 않는 브라우저입니다.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "./firebase-messaging-sw.js"
    );
    console.log("서비스 워커 등록 완료:", registration.scope);

    messaging = getMessagingInstance();

    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("포그라운드 메시지 수신:", payload);
      });
    }
  } catch (error) {
    console.error("FCM 초기화 실패:", error);
  }
}

/**
 * 알림 권한 요청 및 FCM 토큰 저장
 */
export async function requestNotificationPermission(userId: string): Promise<void> {
  if (!messaging) {
    console.log('FCM이 초기화되지 않았습니다.');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('알림 권한 허용됨');

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('FCM 토큰:', token);

        await setDoc(doc(db, "fcmTokens", userId), {
          token: token,
          updatedAt: serverTimestamp()
        });
        fcmTokenSaved = true;
        console.log('FCM 토큰 저장 완료');
      }
    } else {
      console.log('알림 권한 거부됨');
    }
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
  }
}

/**
 * FCM 토큰 저장 여부 확인
 */
export function isFcmTokenSaved(): boolean {
  return fcmTokenSaved;
}
