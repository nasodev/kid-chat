import type { NameColorClass } from '@/types';

/**
 * 이름에 따른 색상 클래스 반환
 */
export function getNameClass(name: string): NameColorClass {
  if (name === "나윤") return "color-nayoon";
  if (name === "소윤") return "color-soyoon";

  const colors: NameColorClass[] = ["color-parent1", "color-parent2", "color-parent3"];
  const hash = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[hash];
}

/**
 * 이름을 가상 이메일로 변환
 */
export function nameToEmail(name: string): string {
  return `${name}@kidchat.local`;
}

/**
 * 시간 포맷팅
 */
export function formatTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  if (isToday) {
    return timeStr;
  }

  const dateStr = date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric"
  });
  return `${dateStr} ${timeStr}`;
}

/**
 * DOM 요소 안전하게 가져오기
 */
export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element as T;
}
