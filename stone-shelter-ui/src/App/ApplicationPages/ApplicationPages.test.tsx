import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { App } from '../App';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('photo links address the precise stone after sorting and paging, then return with catalog state and scroll', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Sort stones'), { target: { value: 'OLDEST' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Small' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Medium' }));
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
  fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-08-31' } });
  fireEvent.click(screen.getByRole('button', { name: 'Close filters' }));
  const catalog = screen.getByRole('main', { name: 'Stone catalog' });
  const names = within(catalog).getAllByRole('heading', { level: 2 }).map(heading => heading.textContent);
  const link = within(catalog).getByRole('link', { name: `View details for ${names[0]}` });
  const href = link.getAttribute('href');
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(412);
  fireEvent.click(link);
  expect(window.location.pathname).toBe(href);
  expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 }).textContent).toBe(names[0]);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  expect(document.activeElement?.tagName).toBe('H1');
  fireEvent.click(screen.getByRole('link', { name: 'Back to catalog' }));
  expect(window.location.pathname).toBe('/stone-shelter/catalog');
  expect(within(screen.getByRole('main')).getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)).toEqual(names);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 412, behavior: 'instant' });
  expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
  expect((screen.getByLabelText('Stones per page') as HTMLSelectElement).value).toBe('12');
  expect((screen.getByLabelText('Sort stones') as HTMLSelectElement).value).toBe('OLDEST');
  expect(screen.getByRole('button', { name: 'Open filters' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Open filters' }));
  expect((screen.getByRole('checkbox', { name: 'Small' }) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByRole('checkbox', { name: 'Medium' }) as HTMLInputElement).checked).toBe(true);
  expect((screen.getByLabelText('To') as HTMLInputElement).value).toBe('2026-08-31');
  expect(screen.getByRole('alert').textContent).toBe('From must be on or before To.');
});

test('direct visits look up stones beyond the visible catalog and return to defaults', () => {
  window.history.replaceState(null, '', '/stone-shelter/stones/1');
  render(<App />);
  expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Mars' })).toBeTruthy();
  expect(screen.getByText('ID 1')).toBeTruthy();
  expect(screen.getByText('Basalt')).toBeTruthy();
  expect(screen.getByText('Small')).toBeTruthy();
  expect(screen.getByText('Available')).toBeTruthy();
  expect(screen.getByText('September 1, 2026')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: /View photo/ })).toHaveLength(6);
  fireEvent.click(screen.getByRole('link', { name: 'Back to catalog' }));
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect((screen.getByLabelText('Sort stones') as HTMLSelectElement).value).toBe('NEWEST');
});

test.each(['/stone-shelter/stones/999', '/stone-shelter/stones/not-an-id', '/stone-shelter/stones/0', '/stone-shelter/stones/1/extra', '/stone-shelter/stones/9007199254740993'])('shows a recoverable not-found state for %s', path => {
  window.history.replaceState(null, '', path);
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Stone not found' })).toBeTruthy();
  expect(screen.queryByText('Characteristics')).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Back to catalog' }));
  expect(screen.getAllByRole('article')).toHaveLength(8);
});

test('browser back and forward restore routes and reset gallery selection on each detail visit', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Sort stones'), { target: { value: 'OLDEST' } });
  fireEvent.click(screen.getByRole('link', { name: 'View details for Mars' }));
  fireEvent.click(screen.getByRole('button', { name: 'View photo 3 of Mars' }));
  expect(screen.getByRole('button', { name: 'View photo 3 of Mars' }).getAttribute('aria-pressed')).toBe('true');
  window.history.back();
  await waitFor(() => expect(screen.getByRole('main', { name: 'Stone catalog' })).toBeTruthy());
  expect((screen.getByLabelText('Sort stones') as HTMLSelectElement).value).toBe('OLDEST');
  window.history.forward();
  await waitFor(() => expect(screen.getByRole('button', { name: 'View photo 1 of Mars' })).toBeTruthy());
  expect(screen.getByRole('button', { name: 'View photo 1 of Mars' }).getAttribute('aria-pressed')).toBe('true');
});

test('modified clicks retain native link behavior without changing the current route', () => {
  render(<App />);
  const link = screen.getByRole('link', { name: 'View details for Meadow' });
  let preventedBeforeNativeDefault = true;
  const cancelBrowserDefault = (event: Event) => {
    preventedBeforeNativeDefault = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener('click', cancelBrowserDefault);
  try {
    fireEvent.click(link, { ctrlKey: true });
    expect(preventedBeforeNativeDefault).toBe(false);
    expect(window.location.pathname).toBe('/stone-shelter/catalog');
    expect(link.getAttribute('href')).toBe('/stone-shelter/stones/30');
  } finally { document.removeEventListener('click', cancelBrowserDefault); }
});

test.each([
  ['/', '/stone-shelter/catalog', 'Stone catalog'],
  ['/stone-shelter/', '/stone-shelter/catalog', 'Stone catalog'],
  ['/stone-shelter/catalog/', '/stone-shelter/catalog', 'Stone catalog'],
  ['/stones/new/', '/stone-shelter/add-stone', 'Add a stone'],
  ['/stones/1/', '/stone-shelter/stones/1', 'Mars'],
  ['/stone-shelter/stones/1/', '/stone-shelter/stones/1', 'Mars'],
])('normalizes %s without adding history entries or losing query/fragment', (path, canonical, pageName) => {
  window.history.replaceState({ source: 'direct' }, '', `${path}?source=bookmark#content`);
  const historyLength = window.history.length;
  render(<App />);
  expect(window.location.pathname).toBe(canonical);
  expect(window.location.search).toBe('?source=bookmark');
  expect(window.location.hash).toBe('#content');
  expect(window.history.length).toBe(historyLength);
  expect(window.history.state).toEqual({ source: 'direct' });
  expect(screen.getByRole('main', { name: pageName })).toBeTruthy();
});

test('header catalog link navigates from a direct stone visit and participates in history', async () => {
  window.history.replaceState(null, '', '/stone-shelter/stones/1');
  render(<App />);
  const link = within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Stone catalog' });
  expect(link.getAttribute('href')).toBe('/stone-shelter/catalog');
  const historyLength = window.history.length;
  fireEvent.click(link);
  expect(window.location.pathname).toBe('/stone-shelter/catalog');
  expect(screen.getByRole('main', { name: 'Stone catalog' })).toBeTruthy();
  expect(window.history.length).toBe(historyLength + 1);
  fireEvent.click(link);
  expect(window.history.length).toBe(historyLength + 1);
  window.history.back();
  await waitFor(() => expect(screen.getByRole('main', { name: 'Mars' })).toBeTruthy());
});

test('unknown pages offer canonical recovery with shared layout and heading focus', () => {
  window.history.replaceState(null, '', '/stone-shelter/missing');
  render(<App />);
  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Page not found' }));
  expect(screen.queryByRole('heading', { name: 'Stone not found' })).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Back to catalog' }));
  expect(window.location.pathname).toBe('/stone-shelter/catalog');
  expect(screen.getAllByRole('article')).toHaveLength(8);
});

test('native external, download, target and modified link actions are not intercepted', () => {
  render(<App />);
  const link = screen.getByRole('link', { name: 'Add stone' });
  let prevented = true;
  const cancelNative = (event: Event) => { prevented = event.defaultPrevented; event.preventDefault(); };
  document.addEventListener('click', cancelNative);
  try {
    for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      fireEvent.click(link, modifiers);
      expect(prevented).toBe(false);
    }
    link.setAttribute('target', '_blank');
    fireEvent.click(link);
    expect(prevented).toBe(false);
    link.removeAttribute('target');
    link.setAttribute('download', '');
    fireEvent.click(link);
    expect(prevented).toBe(false);
    link.removeAttribute('download');
    link.setAttribute('href', 'https://example.com/stone-shelter/catalog');
    fireEvent.click(link);
    expect(prevented).toBe(false);
    expect(window.location.pathname).toBe('/stone-shelter/catalog');
  } finally { document.removeEventListener('click', cancelNative); }
});
