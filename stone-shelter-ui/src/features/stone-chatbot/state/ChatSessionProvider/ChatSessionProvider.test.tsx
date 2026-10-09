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
beforeEach(() => { window.history.replaceState(null, '', '/stone-shelter/catalog'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('session UUID and state survive consumer rerenders; a new provider starts fresh', () => {
  const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  const uuid = chat.result.current.conversationId;
  expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
  act(() => { chat.result.current.setOpen(true); chat.result.current.setDraft('draft'); });
  chat.rerender();
  expect(chat.result.current).toMatchObject({ conversationId: uuid, open: true, draft: 'draft' });
  chat.unmount();
  const next = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  expect(next.result.current.conversationId).not.toBe(uuid);
  expect(next.result.current).toMatchObject({ open: false, draft: '', messages: [], pending: false });
});

test('guards synchronous duplicate sends and preserves pending context across navigation/collapse', async () => {
  const pending = deferred();
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockReturnValue(pending.promise);
  window.history.replaceState(null, '', '/stone-shelter/stones/3');
  const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  const uuid = chat.result.current.conversationId;
  act(() => { chat.result.current.setOpen(true); chat.result.current.setDraft('first'); });
  act(() => { chat.result.current.send(); chat.result.current.send('duplicate'); });
  expect(send).toHaveBeenCalledExactlyOnceWith({ conversationId: uuid, message: 'first', context: { stoneId: 3 } });
  expect(chat.result.current).toMatchObject({ pending: true, draft: '', messages: [{ role: 'USER', text: 'first', stones: [] }] });
  window.history.replaceState(null, '', '/stone-shelter/catalog');
  act(() => { chat.result.current.setOpen(false); chat.result.current.setDraft('next'); });
  await act(async () => { pending.resolve(response); });
  expect(chat.result.current).toMatchObject({ conversationId: uuid, open: false, draft: 'next', pending: false });
  expect(chat.result.current.messages).toEqual([{ role: 'USER', text: 'first', stones: [] }, { role: 'ASSISTANT', ...response }]);
  send.mockResolvedValueOnce({ text: 'Hello', stones: [] });
  act(() => { chat.result.current.send(); });
  await waitFor(() => expect(chat.result.current.pending).toBe(false));
  expect(send).toHaveBeenLastCalledWith({ conversationId: uuid, message: 'next', context: { stoneId: null } });
});

test('failed request survives route changes and retry uses the original payload without duplicate messages', async () => {
  const pending = deferred();
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockReturnValueOnce(pending.promise).mockResolvedValue(response);
  window.history.replaceState(null, '', '/stone-shelter/stones/1');
  const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  act(() => { chat.result.current.send('  About this stone  '); });
  window.history.replaceState(null, '', '/stone-shelter/add-stone');
  await act(async () => { pending.reject(new Error('Try later')); });
  expect(chat.result.current.error).toBe('Try later');
  expect(chat.result.current.messages).toHaveLength(1);
  act(() => { chat.result.current.send('out of order'); });
  expect(send).toHaveBeenCalledTimes(1);
  act(() => { chat.result.current.retry(); chat.result.current.retry(); });
  await waitFor(() => expect(chat.result.current.pending).toBe(false));
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1]).toEqual(send.mock.calls[0]);
  expect(chat.result.current.messages).toHaveLength(2);
  expect(chat.result.current.error).toBeUndefined();
});

test('validates blank/oversized input and accepts exactly 2000 characters without trimming', async () => {
  const send = vi.spyOn(chatbotApi, 'sendChatMessage').mockResolvedValue(response);
  const chat = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  act(() => { chat.result.current.send(' \t\n'); });
  expect(chat.result.current.inputError).toBe('Enter a message.');
  act(() => { chat.result.current.send('x'.repeat(2001)); });
  expect(chat.result.current.inputError).toBe('Use at most 2000 characters.');
  expect(send).not.toHaveBeenCalled();
  act(() => { chat.result.current.send(' ' + 'x'.repeat(1999)); });
  await waitFor(() => expect(chat.result.current.pending).toBe(false));
  expect(send.mock.calls[0][0].message).toBe(' ' + 'x'.repeat(1999));
});

test('disposed providers cannot append an obsolete response to a new session', async () => {
  const pending = deferred();
  vi.spyOn(chatbotApi, 'sendChatMessage').mockReturnValue(pending.promise);
  const first = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  act(() => { first.result.current.send('first'); });
  first.unmount();
  const next = renderHook(useChatSession, { wrapper: ChatSessionProvider });
  await act(async () => { pending.resolve(response); });
  expect(next.result.current.messages).toEqual([]);
});
