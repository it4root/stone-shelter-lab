import type { StoneChatMessageRequest } from './dto/StoneChatMessageRequest';
import type { StoneChatMessageResponse } from './dto/StoneChatMessageResponse';
import { jsonRequest, requestJson } from './httpClient';

export async function sendChatMessage(stoneChatMessageRequest: StoneChatMessageRequest): Promise<StoneChatMessageResponse> {
  if (import.meta.env.MODE === 'mock') return (await import('../mocks/api/mockChatbotApi')).sendMockChatMessage();
  return requestJson<StoneChatMessageResponse>('/api/v1/chat/messages', jsonRequest(stoneChatMessageRequest),
    stoneChatMessageResponse => typeof stoneChatMessageResponse.text === 'string' && Boolean(stoneChatMessageResponse.text.trim())
      && Array.isArray(stoneChatMessageResponse.stones)
      && stoneChatMessageResponse.stones.every(stoneChatStone => Boolean(stoneChatStone)
        && Number.isSafeInteger(stoneChatStone.id) && stoneChatStone.id > 0
        && typeof stoneChatStone.name === 'string' && Boolean(stoneChatStone.name.trim())));
}
