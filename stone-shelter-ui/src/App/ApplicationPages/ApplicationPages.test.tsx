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
  expect(window.location.pathname).toBe('/');
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
  window.history.replaceState(null, '', '/stones/1');
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

test.each(['/stones/999', '/stones/not-an-id', '/stones/0', '/stones/1/extra', '/stones/9007199254740993'])('shows a recoverable not-found state for %s', path => {
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
    expect(window.location.pathname).toBe('/');
    expect(link.getAttribute('href')).toBe('/stones/30');
  } finally { document.removeEventListener('click', cancelBrowserDefault); }
});
