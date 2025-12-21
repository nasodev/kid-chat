import { getCurrentUser } from './auth';

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8001';

export interface AIResponse {
  response: string;
  elapsed_time_ms: number;
  truncated: boolean;
}

/**
 * AI 서버에 프롬프트 전송 및 응답 받기
 */
export async function askAI(prompt: string, timeoutSeconds?: number): Promise<string> {
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
  return data.response;
}
