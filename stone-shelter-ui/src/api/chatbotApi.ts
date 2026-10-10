import type { StoneChatMessageRequest } from './dto/StoneChatMessageRequest';
import type { StoneChatMessageResponse } from './dto/StoneChatMessageResponse';
import type { StoneChatHistoryResponse } from './dto/StoneChatHistoryResponse';

export class ChatApiError extends Error {
  constructor(public status: number, public code: string, message: string, public retryAfter = 0) { super(message); }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validAnswer(value: unknown): value is StoneChatMessageResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as StoneChatMessageResponse;
  return typeof response.text === 'string' && Boolean(response.text.trim()) && Array.isArray(response.stones)
    && response.stones.every(stone => stone && Number.isSafeInteger(stone.id) && stone.id > 0
      && typeof stone.name === 'string' && Boolean(stone.name.trim()));
}

async function request<T>(path: string, options: RequestInit, validate: (value: unknown) => value is T): Promise<T> {
  let response: Response;
  try { response = await fetch(`${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}${path}`, { ...options, credentials: 'include' }); }
  catch { throw new ChatApiError(0, 'CHAT_UNAVAILABLE', 'Chat could not be reached. Restore history manually.'); }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new ChatApiError(response.status, 'CHAT_UNAVAILABLE', 'Chat returned an unreadable response. Restore history manually.'); }
  if (!response.ok) {
    const problem = body as { code?: unknown; detail?: unknown } | null;
    const retryAfter = Number(response.headers.get('Retry-After'));
    if (response.status === 429 && (!Number.isInteger(retryAfter) || retryAfter <= 0))
      throw new ChatApiError(503, 'CHAT_UNAVAILABLE', 'Chat returned unknown admission state. Restore history manually.');
    throw new ChatApiError(response.status, typeof problem?.code === 'string' ? problem.code : `HTTP_${response.status}`,
      typeof problem?.detail === 'string' ? problem.detail : 'Chat request failed.', response.status === 429 ? retryAfter : 0);
  }
  if (!validate(body)) throw new ChatApiError(503, 'CHAT_UNAVAILABLE', 'Chat returned invalid history or response. Restore history manually.');
  return body;
}

export async function sendChatMessage(requestBody: StoneChatMessageRequest): Promise<StoneChatMessageResponse> {
  if (import.meta.env.MODE === 'mock') return (await import('../mocks/api/mockChatbotApi')).sendMockChatMessage(requestBody);
  return request('/api/v1/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }, validAnswer);
}

export async function getChatHistory(conversationId: string): Promise<StoneChatHistoryResponse> {
  if (import.meta.env.MODE === 'mock') return (await import('../mocks/api/mockChatbotApi')).getMockChatHistory(conversationId);
  return request(`/api/v1/chat/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'GET' },
    (value): value is StoneChatHistoryResponse => {
      if (!value || typeof value !== 'object') return false;
      const history = value as StoneChatHistoryResponse;
      if (history.conversationId !== conversationId || !Array.isArray(history.messages) || history.messages.length % 2 !== 0) return false;
      const turnIds = new Set<string>();
      for (let index = 0; index < history.messages.length; index += 2) {
        const user = history.messages[index]; const assistant = history.messages[index + 1];
        if (!user || !assistant || user.role !== 'USER' || assistant.role !== 'ASSISTANT' || !uuid.test(user.turnId)
          || user.turnId !== assistant.turnId || turnIds.has(user.turnId) || typeof user.text !== 'string'
          || !Array.isArray(user.stones) || user.stones.length !== 0 || assistant.context !== null || !validAnswer(assistant)
          || (user.context !== null && (!user.context || typeof user.context !== 'object'
            || !(user.context.stoneId === null || Number.isSafeInteger(user.context.stoneId) && (user.context.stoneId ?? 0) > 0)))) return false;
        turnIds.add(user.turnId);
      }
      return true;
    });
}
