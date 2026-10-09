import { afterEach, expect, test, vi } from 'vitest';
import { sendChatMessage } from './chatbotApi';

const request = { conversationId: '9960a79a-ae24-4c89-9f54-51103bcb00c9', message: '  A stone please  ', context: { stoneId: 3 } };
const response = { text: 'Here are some stones you might like.', stones: [{ id: 1, name: 'Mars' }, { id: 3, name: 'Luna' }] };

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.stubEnv('MODE', 'mock'); });

test('API mode posts only the new message and context through the configured transport', async () => {
  vi.stubEnv('MODE', 'api');
  vi.stubEnv('VITE_API_BASE_URL', 'https://backend.example/');
  const fetch = vi.fn().mockResolvedValue(Response.json(response));
  vi.stubGlobal('fetch', fetch);
  expect(await sendChatMessage(request)).toEqual(response);
  expect(fetch).toHaveBeenCalledExactlyOnceWith('https://backend.example/api/v1/chat/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
  });
});

test('mock mode returns an independent fixed response without fetch', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const first = await sendChatMessage(request);
  expect(first).toEqual(response);
  first.stones.reverse();
  expect(await sendChatMessage({ ...request, message: 'Other topic' })).toEqual(response);
  expect(fetch).not.toHaveBeenCalled();
});

test('ordinary modes use the API and accept a text response without stone suggestions', async () => {
  const fetch = vi.fn().mockImplementation(async () => Response.json({ text: 'Hello', stones: [] }));
  vi.stubGlobal('fetch', fetch);
  for (const mode of ['development', 'production', 'api']) {
    vi.stubEnv('MODE', mode);
    expect(await sendChatMessage(request)).toEqual({ text: 'Hello', stones: [] });
  }
  expect(fetch).toHaveBeenCalledTimes(3);
});

test.each([
  null, {}, { text: ' ', stones: [] }, { text: 'Hi', stones: null },
  { text: 'Hi', stones: [null] }, { text: 'Hi', stones: [{ id: 0, name: 'Mars' }] },
  { text: 'Hi', stones: [{ id: Number.MAX_SAFE_INTEGER + 1, name: 'Mars' }] },
  { text: 'Hi', stones: [{ id: 1, name: ' ' }] },
])('rejects a malformed chatbot response: %j', async body => {
  vi.stubEnv('MODE', 'api');
  const fetch = vi.fn().mockResolvedValue(Response.json(body));
  vi.stubGlobal('fetch', fetch);
  await expect(sendChatMessage(request)).rejects.toThrow('invalid response');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('preserves ProblemDetail and normalizes network/non-JSON errors without mock fallback', async () => {
  vi.stubEnv('MODE', 'api');
  const fetch = vi.fn().mockResolvedValue(Response.json({ detail: 'Message rejected' }, { status: 400 }));
  vi.stubGlobal('fetch', fetch);
  await expect(sendChatMessage(request)).rejects.toMatchObject({ status: 400, message: 'Message rejected' });
  fetch.mockRejectedValueOnce(new TypeError('Network'));
  await expect(sendChatMessage(request)).rejects.toMatchObject({ status: 0 });
  fetch.mockResolvedValueOnce(new Response('<html>Error</html>', { status: 502 }));
  await expect(sendChatMessage(request)).rejects.toMatchObject({ status: 502 });
  expect(fetch).toHaveBeenCalledTimes(3);
});
