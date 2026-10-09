import type { StoneChatContext } from './StoneChatContext';

export interface StoneChatMessageRequest {
  conversationId: string;
  message: string;
  context?: StoneChatContext | null;
}
