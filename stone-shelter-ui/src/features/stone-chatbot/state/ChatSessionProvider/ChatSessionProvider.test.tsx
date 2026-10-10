import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import * as chatbotApi from '../../../../api/chatbotApi';
import type { StoneChatMessageResponse } from '../../../../api/dto/StoneChatMessageResponse';
import { ChatSessionProvider, useChatSession } from './ChatSessionProvider';

const response = { text: 'A choice for you', stones: [{ id: 3, name: 'Luna' }, { id: 1, name: 'Mars' }] };
function deferred() {
  let resolve!: (response: StoneChatMessageResponse) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<StoneChatMessageResponse>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  sessionStorage.clear(); window.history.replaceState(null, '', '/stone-shelter/catalog');
  vi.spyOn(chatbotApi, 'getChatHistory').mockImplementation(async id => ({ conversationId: id, messages: [] }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
async function mount() {
  const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  await waitFor(() => expect(chat.result.current.restoring).toBe(false)); return chat;
}

test('reload preserves tab UUID, restores committed history, starts collapsed and discards draft', async () => {
  const first = await mount(); const id = first.result.current.conversationId;
  act(() => { first.result.current.setOpen(true); first.result.current.setDraft('draft'); }); first.unmount();
  const turnId = crypto.randomUUID();
  vi.mocked(chatbotApi.getChatHistory).mockResolvedValueOnce({ conversationId: id, messages: [
    { role: 'USER', text: 'saved', stones: [], context: { stoneId: 3 }, turnId },
    { role: 'ASSISTANT', ...response, context: null, turnId },
  ] });
  const next = await mount();
  expect(next.result.current).toMatchObject({ conversationId: id, open: false, draft: '', pending: false });
  expect(next.result.current.messages).toHaveLength(2);
});

test('duplicate sends are blocked and original context and pair ID survive navigation/collapse', async () => {
  const pending = deferred(); const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockReturnValue(pending.promise);
  window.history.replaceState(null, '', '/stone-shelter/stones/3'); const chat = await mount();
  act(() => { chat.result.current.setDraft('first'); });
  act(() => { chat.result.current.send(); chat.result.current.send('duplicate'); });
  const request = send.mock.calls[0][0];
  expect(request).toEqual({ conversationId: chat.result.current.conversationId, turnId: expect.any(String), message: 'first', context: { stoneId: 3 } });
  expect(send).toHaveBeenCalledTimes(1);
  window.history.replaceState(null, '', '/stone-shelter/catalog');
  act(() => { chat.result.current.setOpen(false); chat.result.current.setDraft('next'); });
  await act(async () => { pending.resolve(response); });
  expect(chat.result.current.messages).toEqual([{ role: 'USER', text: 'first', stones: [], turnId: request.turnId },
    { role: 'ASSISTANT', ...response, turnId: request.turnId }]);
  expect(chat.result.current.draft).toBe('next');
});

test('dependency failure blocks send/retry, preserves draft and uncommitted user, then permits only deliberate original retry after recovery', async () => {
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockRejectedValueOnce(new chatbotApi.ChatApiError(503, 'CHAT_UNAVAILABLE', 'Unavailable')).mockResolvedValue(response);
  const chat = await mount(); act(() => { chat.result.current.send('original'); });
  await waitFor(() => expect(chat.result.current.unavailable).toBe(true));
  act(() => { chat.result.current.setDraft('next draft'); chat.result.current.retry(); chat.result.current.send('bypass'); });
  expect(send).toHaveBeenCalledTimes(1);
  await act(async () => { await chat.result.current.restore(); });
  expect(chat.result.current.messages).toHaveLength(1); expect(chat.result.current.draft).toBe('next draft');
  expect(send).toHaveBeenCalledTimes(1);
  act(() => { chat.result.current.retry(); chat.result.current.retry(); });
  await waitFor(() => expect(chat.result.current.pending).toBe(false));
  expect(send.mock.calls[1]).toEqual(send.mock.calls[0]); expect(chat.result.current.messages).toHaveLength(2);
});

test('lost acknowledgement is reconciled by committed pair ID without another POST', async () => {
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockRejectedValue(new chatbotApi.ChatApiError(503, 'CHAT_UNAVAILABLE', 'Unknown commit'));
  const chat = await mount(); act(() => { chat.result.current.send('original'); });
  await waitFor(() => expect(chat.result.current.unavailable).toBe(true));
  const request = send.mock.calls[0][0];
  vi.mocked(chatbotApi.getChatHistory).mockResolvedValueOnce({ conversationId: request.conversationId, messages: [
    { role: 'USER', text: request.message, stones: [], context: request.context ?? null, turnId: request.turnId },
    { role: 'ASSISTANT', ...response, context: null, turnId: request.turnId },
  ] });
  await act(async () => { await chat.result.current.restore(); });
  act(() => { chat.result.current.retry(); });
  expect(send).toHaveBeenCalledTimes(1); expect(chat.result.current.messages).toHaveLength(2); expect(chat.result.current.error).toBeUndefined();
});

test('manual quota retry observes cooldown and uses one user entry and unchanged turn identity', async () => {
  const chat = await mount(); vi.useFakeTimers();
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockRejectedValueOnce(new chatbotApi.ChatApiError(429, 'CHAT_RATE_LIMITED', 'Wait', 2)).mockResolvedValue(response);
  await act(async () => { chat.result.current.send('original'); });
  act(() => { chat.result.current.retry(); }); expect(send).toHaveBeenCalledTimes(1);
  await act(async () => { vi.advanceTimersByTime(2100); }); expect(send).toHaveBeenCalledTimes(1);
  await act(async () => { chat.result.current.retry(); });
  expect(send.mock.calls[1]).toEqual(send.mock.calls[0]); expect(chat.result.current.messages).toHaveLength(2);
});

test('initial restoration blocks sends and failed restoration never fabricates empty history', async () => {
  let reject!: (error: Error) => void;
  vi.mocked(chatbotApi.getChatHistory).mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
  const send = vi.spyOn(chatbotApi, 'sendChatMessage'); const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  act(() => { chat.result.current.send('blocked'); }); expect(send).not.toHaveBeenCalled();
  await act(async () => { reject(new Error('Restore failed')); });
  expect(chat.result.current.unavailable).toBe(true); expect(chat.result.current.restoreError).toBe('Restore failed');
});

test('history quota has a separate manual cooldown and never automatically retries restoration', async () => {
  const chat = await mount(); vi.useFakeTimers();
  vi.mocked(chatbotApi.getChatHistory).mockRejectedValueOnce(new chatbotApi.ChatApiError(429, 'CHAT_RATE_LIMITED', 'Wait to restore', 2));
  await act(async () => { await chat.result.current.restore(); });
  expect(chat.result.current.restoreCooldown).toBe(2);
  expect(chat.result.current.cooldown).toBe(0);
  expect(chat.result.current.unavailable).toBe(true);
  await act(async () => { await chat.result.current.restore(); });
  expect(chatbotApi.getChatHistory).toHaveBeenCalledTimes(2);
  await act(async () => { vi.advanceTimersByTime(2100); });
  expect(chatbotApi.getChatHistory).toHaveBeenCalledTimes(2);
  await act(async () => { await chat.result.current.restore(); });
  expect(chatbotApi.getChatHistory).toHaveBeenCalledTimes(3);
  expect(chat.result.current.unavailable).toBe(false);
});

test('reload during pending work does not reconstruct or resend the abandoned request', async () => {
  const pending = deferred(); const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockReturnValue(pending.promise);
  const first = await mount(); act(() => { first.result.current.send('first'); }); first.unmount();
  const next = await mount(); await act(async () => { pending.resolve(response); });
  expect(next.result.current.messages).toEqual([]); expect(send).toHaveBeenCalledTimes(1);
});
