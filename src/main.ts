import { User, Unsubscribe } from 'firebase/auth';
import { DocumentData, QuerySnapshot } from 'firebase/firestore';

// 스타일
import './styles.css';

// Firebase 모듈
import { initFCM, requestNotificationPermission, isFcmTokenSaved } from '@/firebase/fcm';
import {
  onAuthChange,
  signup,
  login,
  logout,
  changePassword,
  getCurrentUserName
} from '@/firebase/auth';
import { subscribeToMessages, sendMessage, sendAIMessage, deleteMessage, parseMessageData } from '@/firebase/chat';
import { askAI, isAITrigger } from '@/firebase/ai';

// 유틸리티
import { getElement, getNameClass, formatTime } from '@/utils/helpers';

// DOM 요소들
const authCard = getElement<HTMLDivElement>("auth");
const chatCard = getElement<HTMLDivElement>("chat");
const authStatus = getElement<HTMLElement>("auth-status");
const userInfo = getElement<HTMLElement>("user-info");
const messagesDiv = getElement<HTMLDivElement>("messages");
const messageInput = getElement<HTMLInputElement>("message-input");
const nameInput = getElement<HTMLInputElement>("user-name");
const passwordInput = getElement<HTMLInputElement>("user-password");

// 모달 요소들
const modal = getElement<HTMLDivElement>("modal-password");
const passwordStatus = getElement<HTMLElement>("password-status");
const currentPasswordInput = getElement<HTMLInputElement>("current-password");
const newPasswordInput = getElement<HTMLInputElement>("new-password");
const confirmPasswordInput = getElement<HTMLInputElement>("confirm-password");

// 메시지 구독 해제 함수
let messagesUnsub: Unsubscribe | null = null;

/**
 * 메시지 렌더링
 */
function renderMessages(snapshot: QuerySnapshot<DocumentData>, currentUid: string): void {
  messagesDiv.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const message = parseMessageData(docSnap.id, docSnap.data());
    const isMe = message.uid === currentUid;
    const div = document.createElement("div");

    const nameClass = getNameClass(message.name);
    div.className = `msg ${isMe ? "me" : "other"} ${nameClass}`;

    const who = isMe ? "나" : message.name;
    const time = message.createdAt ? formatTime(message.createdAt) : "";

    const deleteBtn = isMe
      ? `<button class="delete-btn" data-id="${message.id}">🗑️</button>`
      : "";

    div.innerHTML = `
      <div class="msg-content">
        <strong>${who}:</strong> ${message.text}
        ${deleteBtn}
      </div>
      <small>${time}</small>
    `;
    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // 삭제 버튼 이벤트 연결
  document.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const target = e.target as HTMLButtonElement;
      const msgId = target.dataset.id;
      if (msgId && confirm("메시지를 삭제할까요?")) {
        await deleteMessage(msgId);
      }
    });
  });
}

/**
 * 인증 상태 변경 핸들러
 */
function handleAuthStateChange(user: User | null): void {
  if (user) {
    // 로그인된 상태
    authCard.hidden = true;
    chatCard.hidden = false;
    const displayName = getCurrentUserName();
    userInfo.textContent = `${displayName}(으)로 접속 중`;
    authStatus.textContent = "";

    // FCM 알림 권한 요청
    if (!isFcmTokenSaved()) {
      requestNotificationPermission(user.uid);
    }

    // 채팅 메시지 실시간 구독
    if (messagesUnsub) messagesUnsub();
    messagesUnsub = subscribeToMessages((snapshot) => {
      renderMessages(snapshot, user.uid);
    });
  } else {
    // 로그아웃 상태
    authCard.hidden = false;
    chatCard.hidden = true;
    if (messagesUnsub) messagesUnsub();
  }
}

/**
 * 이벤트 핸들러 초기화
 */
function initEventHandlers(): void {
  // 나윤/소윤 버튼
  getElement("btn-nayoon").addEventListener("click", () => {
    nameInput.value = "나윤";
    passwordInput.focus();
  });

  getElement("btn-soyoon").addEventListener("click", () => {
    nameInput.value = "소윤";
    passwordInput.focus();
  });

  // 계정 만들기
  getElement("btn-signup").addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const pw = passwordInput.value;

    if (!name || !pw) {
      authStatus.textContent = "이름과 비밀번호를 입력하세요.";
      return;
    }

    authStatus.textContent = "계정 생성 중...";
    try {
      await signup(name, pw);
      authStatus.textContent = "계정 생성 완료!";
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      if (error.code === "auth/email-already-in-use") {
        authStatus.textContent = "이미 있는 이름입니다.";
      } else if (error.code === "auth/weak-password") {
        authStatus.textContent = "비밀번호는 6자 이상이어야 합니다.";
      } else {
        authStatus.textContent = "계정 생성 실패: " + (error.message || "알 수 없는 오류");
      }
    }
  });

  // 로그인
  getElement("btn-login").addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const pw = passwordInput.value;

    if (!name || !pw) {
      authStatus.textContent = "이름과 비밀번호를 입력하세요.";
      return;
    }

    authStatus.textContent = "로그인 중...";
    try {
      await login(name, pw);
      authStatus.textContent = "로그인 성공!";
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      if (error.code === "auth/user-not-found") {
        authStatus.textContent = "없는 이름입니다.";
      } else if (error.code === "auth/wrong-password") {
        authStatus.textContent = "비밀번호가 틀렸습니다.";
      } else {
        authStatus.textContent = "로그인 실패: " + (error.message || "알 수 없는 오류");
      }
    }
  });

  // 로그아웃
  getElement("btn-logout").addEventListener("click", async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  });

  // 메시지 보내기
  // AI 캐릭터: 말랑아, 루팡아, 푸딩아, 마이콜아, 에이아이야

  async function handleSendMessage(): Promise<void> {
    const text = messageInput.value;
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    try {
      // 1. 원본 메시지 전송
      await sendMessage(text);
      messageInput.value = "";

      // 2. AI 요청 감지 (말랑아/루팡아/푸딩아/마이콜아/에이아이야)
      if (isAITrigger(trimmedText)) {
        // AI 응답 받기 (전체 메시지 전송, 백엔드에서 페르소나 감지)
        const result = await askAI(trimmedText);
        // AI 응답을 캐릭터 이름으로 전송
        await sendAIMessage(result.response, result.persona);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      alert(error.message || "메시지 전송 실패");
    }
  }

  getElement("btn-send").addEventListener("click", handleSendMessage);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSendMessage();
  });

  // 설정 버튼 - 모달 열기
  getElement("btn-settings").addEventListener("click", () => {
    modal.hidden = false;
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
    passwordStatus.textContent = "";
    currentPasswordInput.focus();
  });

  // 취소 버튼 - 모달 닫기
  getElement("btn-cancel-password").addEventListener("click", () => {
    modal.hidden = true;
  });

  // 모달 배경 클릭 시 닫기
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.hidden = true;
    }
  });

  // 비밀번호 변경
  getElement("btn-change-password").addEventListener("click", async () => {
    const currentPw = currentPasswordInput.value;
    const newPw = newPasswordInput.value;
    const confirmPw = confirmPasswordInput.value;

    if (!currentPw || !newPw || !confirmPw) {
      passwordStatus.textContent = "모든 항목을 입력하세요.";
      return;
    }

    if (newPw !== confirmPw) {
      passwordStatus.textContent = "새 비밀번호가 일치하지 않습니다.";
      return;
    }

    if (newPw.length < 6) {
      passwordStatus.textContent = "비밀번호는 6자 이상이어야 합니다.";
      return;
    }

    passwordStatus.textContent = "변경 중...";

    try {
      await changePassword(currentPw, newPw);
      passwordStatus.textContent = "비밀번호가 변경되었습니다!";
      setTimeout(() => {
        modal.hidden = true;
      }, 1500);
    } catch (e: unknown) {
      const error = e as { code?: string; message?: string };
      if (error.code === "auth/wrong-password") {
        passwordStatus.textContent = "현재 비밀번호가 틀렸습니다.";
      } else {
        passwordStatus.textContent = "변경 실패: " + (error.message || "알 수 없는 오류");
      }
    }
  });
}

/**
 * 앱 초기화
 */
async function initApp(): Promise<void> {
  // FCM 초기화
  await initFCM();

  // 이벤트 핸들러 초기화
  initEventHandlers();

  // 인증 상태 감시
  onAuthChange(handleAuthStateChange);
}

// 앱 시작
initApp();
