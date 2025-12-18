import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  Unsubscribe
} from 'firebase/auth';
import { auth } from './config';
import { nameToEmail } from '@/utils/helpers';

// 현재 사용자 이름 상태
let currentUserName: string | null = null;

/**
 * 현재 사용자 이름 가져오기
 */
export function getCurrentUserName(): string {
  return currentUserName || localStorage.getItem("userName") || "사용자";
}

/**
 * 현재 사용자 이름 설정
 */
export function setCurrentUserName(name: string | null): void {
  currentUserName = name;
  if (name) {
    localStorage.setItem("userName", name);
  } else {
    localStorage.removeItem("userName");
  }
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * 계정 생성
 */
export async function signup(name: string, password: string): Promise<void> {
  const email = nameToEmail(name);
  await createUserWithEmailAndPassword(auth, email, password);
  setCurrentUserName(name);
}

/**
 * 로그인
 */
export async function login(name: string, password: string): Promise<void> {
  const email = nameToEmail(name);
  await signInWithEmailAndPassword(auth, email, password);
  setCurrentUserName(name);
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await signOut(auth);
  setCurrentUserName(null);
}

/**
 * 비밀번호 변경
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("로그인이 필요합니다.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/**
 * 현재 인증된 사용자 가져오기
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
