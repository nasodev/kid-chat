import { getCurrentUser } from './auth';

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8001';

export interface AIResponse {
  response: string;
  elapsed_time_ms: number;
  truncated: boolean;
  persona: string | null;  // 응답한 AI 캐릭터 (말랑이/루팡/푸딩/마이콜)
}

export interface AIChatResult {
  response: string;
  persona: string;
}

// AI 캐릭터 호출어 목록
export const AI_TRIGGERS = ['말랑', '루팡', '푸딩', '마이콜', '에이아이'] as const;

/**
 * 메시지가 AI 호출인지 확인
 */
export function isAITrigger(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  return AI_TRIGGERS.some(trigger =>
    trimmed.startsWith(trigger + '아') ||
    trimmed.startsWith(trigger + '이') ||
    trimmed.startsWith(trigger + '야')
  );
}

/**
 * AI 서버에 프롬프트 전송 및 응답 받기
 *
 * 호출 방법:
 * - "말랑아 ..." → 말랑이 (다정한 친구)
 * - "루팡아 ..." → 루팡 (건방진 친구)
 * - "푸딩아 ..." → 푸딩 (애완동물 느낌)
 * - "마이콜아 ..." → 마이콜 (영어 선생님)
 * - "에이아이야 ..." → 말랑이 (기존 호환)
 */
export async function askAI(prompt: string, timeoutSeconds?: number): Promise<AIChatResult> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  // Firebase ID Token 획득
  const token = await user.getIdToken();

  const body: { prompt: string; timeout_seconds?: number } = { prompt };
  if (timeoutSeconds) {
    body.timeout_seconds = timeoutSeconds;
  }

  const response = await fetch(`${AI_SERVER_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (response.status === 400) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.detail?.error_type === 'no_trigger') {
      throw new Error('AI 호출어가 없습니다. (말랑아/루팡아/푸딩아/마이콜아)');
    }
    throw new Error(errorData.detail?.error || 'AI 요청 오류');
  }

  if (response.status === 401) {
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (response.status === 403) {
    throw new Error('로그인이 필요합니다.');
  }

  if (response.status === 408) {
    throw new Error('AI 응답 시간이 초과되었습니다. 다시 시도해주세요.');
  }

  if (response.status === 503) {
    throw new Error('AI 서비스를 이용할 수 없습니다.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.error || 'AI 서버 응답 오류');
  }

  const data: AIResponse = await response.json();
  return {
    response: data.response,
    persona: data.persona || '말랑이'
  };
}
