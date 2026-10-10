import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChatApiError, getChatHistory, sendChatMessage } from '../../../../api/chatbotApi';
import type { StoneChatMessageRequest } from '../../../../api/dto/StoneChatMessageRequest';
import type { StoneChatMessageResponse } from '../../../../api/dto/StoneChatMessageResponse';
import type { ChatMessageRole } from '../../../../enums/ChatMessageRole';
import { resolvePageRoute } from '../../../../App/navigation/pageRoutes';

interface ChatMessage extends StoneChatMessageResponse {
  role: ChatMessageRole;
  turnId: string;
}

function useChatSessionState() {
  const [conversationId] = useState(() => {
    const saved = sessionStorage.getItem('stone-chat-conversation');
    if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved)) return saved;
    const id = crypto.randomUUID(); sessionStorage.setItem('stone-chat-conversation', id); return id;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraftValue] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [inputError, setInputError] = useState<string>();
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState<string>();
  const [unavailable, setUnavailable] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownUntil = useRef(0);
  const [restoreCooldown, setRestoreCooldown] = useState(0);
  const restoreCooldownUntil = useRef(0);
  const hydrationStarted = useRef(false);
  const recovering = useRef(false);
  const busy = useRef(false);
  const failedRequest = useRef<StoneChatMessageRequest | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (!hydrationStarted.current) { hydrationStarted.current = true; void restore(); }
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!cooldown && !restoreCooldown) return;
    const timer = window.setInterval(() => {
      setCooldown(Math.max(0, Math.ceil((cooldownUntil.current - Date.now()) / 1000)));
      setRestoreCooldown(Math.max(0, Math.ceil((restoreCooldownUntil.current - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(timer);
  }, [cooldown, restoreCooldown]);

  async function restore() {
    if (recovering.current || busy.current || restoreCooldownUntil.current > Date.now()) return;
    recovering.current = true; setRestoring(true); setRestoreError(undefined);
    try {
      const history = await getChatHistory(conversationId);
      if (!mounted.current) return;
      const failed = failedRequest.current;
      if (failed && history.messages.some(message => message.turnId === failed.turnId && message.role === 'ASSISTANT')) {
        failedRequest.current = null; setError(undefined);
      }
      setMessages(failedRequest.current ? [...history.messages,
        { role: 'USER', text: failedRequest.current.message, stones: [], turnId: failedRequest.current.turnId }] : history.messages);
      setUnavailable(false);
    } catch (failure) {
      if (mounted.current) {
        if (failure instanceof ChatApiError && failure.retryAfter > 0) {
          restoreCooldownUntil.current = Date.now() + failure.retryAfter * 1000;
          setRestoreCooldown(failure.retryAfter);
        }
        setUnavailable(true); setRestoreError(failure instanceof Error ? failure.message : 'History could not be restored.');
      }
    } finally {
      recovering.current = false; if (mounted.current) setRestoring(false);
    }
  }

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
      setMessages(previous => [...previous, { role: 'ASSISTANT', turnId: stoneChatMessageRequest.turnId, ...stoneChatMessageResponse }]);
      failedRequest.current = null;
    } catch (error) {
      if (!mounted.current) return;
      failedRequest.current = stoneChatMessageRequest;
      if (error instanceof ChatApiError && error.retryAfter > 0) {
        cooldownUntil.current = Date.now() + error.retryAfter * 1000; setCooldown(error.retryAfter);
      }
      if (!(error instanceof ChatApiError) || error.status === 0 || error.status === 503 || error.code === 'CHAT_UNAVAILABLE') setUnavailable(true);
      setError(error instanceof Error && error.message.trim() ? error.message : 'The message could not be sent. Please try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  function send(message = draft) {
    if (busy.current || failedRequest.current || restoring || unavailable || cooldownUntil.current > Date.now()) return;
    if (!message.trim() || message.length > 2000) {
      setInputError(message.trim() ? 'Use at most 2000 characters.' : 'Enter a message.');
      return;
    }
    const pageRoute = resolvePageRoute(window.location.pathname);
    const turnId = crypto.randomUUID();
    setMessages(previous => [...previous, { role: 'USER', text: message, stones: [], turnId }]);
    setDraftValue('');
    setInputError(undefined);
    void execute({ conversationId, turnId, message, context: { stoneId: pageRoute.page === 'stone-details' ? pageRoute.id ?? null : null } });
  }

  function retry() {
    if (busy.current || !failedRequest.current || restoring || unavailable || cooldownUntil.current > Date.now()) return;
    void execute(failedRequest.current);
  }

  return { conversationId, messages, open, setOpen, draft, setDraft, pending, error, inputError, restoring, restoreError, unavailable, cooldown, restoreCooldown, restore, send, retry };
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
