import type { StoneChatMessageResponse } from '../../api/dto/StoneChatMessageResponse';

export async function sendMockChatMessage(): Promise<StoneChatMessageResponse> {
  return {
    text: 'Here are some stones you might like.',
    stones: [{ id: 1, name: 'Mars' }, { id: 3, name: 'Luna' }],
  };
}
