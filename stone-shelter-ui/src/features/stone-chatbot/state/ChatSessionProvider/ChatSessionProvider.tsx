import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { sendChatMessage } from '../../../../api/chatbotApi';
import type { StoneChatMessageRequest } from '../../../../api/dto/StoneChatMessageRequest';
import type { StoneChatMessageResponse } from '../../../../api/dto/StoneChatMessageResponse';
import type { ChatMessageRole } from '../../../../enums/ChatMessageRole';
import { resolvePageRoute } from '../../../../App/navigation/pageRoutes';

interface ChatMessage extends StoneChatMessageResponse {
  role: ChatMessageRole;
}

function useChatSessionState() {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraftValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [inputError, setInputError] = useState<string>();
  const busy = useRef(false);
  const failedRequest = useRef<StoneChatMessageRequest | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function setDraft(value: string) {
    setDraftValue(value);
    setInputError(undefined);
  }

  async function execute(stoneChatMessageRequest: StoneChatMessageRequest) {
    busy.current = true;
    setPending(true);
    setError(undefined);
    try {
      const stoneChatMessageResponse = await sendChatMessage(stoneChatMessageRequest);
      if (!mounted.current) return;
      setMessages(previous => [...previous, { role: 'ASSISTANT', ...stoneChatMessageResponse }]);
      failedRequest.current = null;
    } catch (error) {
      if (!mounted.current) return;
      failedRequest.current = stoneChatMessageRequest;
      setError(error instanceof Error && error.message.trim() ? error.message : 'The message could not be sent. Please try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function send(message = draft) {
    if (busy.current || failedRequest.current) return;
    if (!message.trim() || message.length > 2000) {
      setInputError(message.trim() ? 'Use at most 2000 characters.' : 'Enter a message.');
      return;
    }
    const pageRoute = resolvePageRoute(window.location.pathname);
    setMessages(previous => [...previous, { role: 'USER', text: message, stones: [] }]);
    setDraftValue('');
    setInputError(undefined);
    void execute({ conversationId, message, context: { stoneId: pageRoute.page === 'stone-details' ? pageRoute.id ?? null : null } });
  }

  function retry() {
    if (busy.current || !failedRequest.current) return;
    void execute(failedRequest.current);
  }

  return { conversationId, messages, open, setOpen, draft, setDraft, pending, error, inputError, send, retry };
}

const ChatSessionContext = createContext<ReturnType<typeof useChatSessionState> | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  return <ChatSessionContext.Provider value={useChatSessionState()}>{children}</ChatSessionContext.Provider>;
}

export function useChatSession() {
  const chatSession = useContext(ChatSessionContext);
  if (!chatSession) throw new Error('Chat must be inside ChatSessionProvider.');
  return chatSession;
}
