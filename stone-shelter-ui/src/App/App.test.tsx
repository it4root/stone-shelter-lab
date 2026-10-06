import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App } from './App';
import { StoneCard } from '../domain/stone/components/StoneCard/StoneCard';
import { mockStones } from '../mocks/data/stones';

afterEach(cleanup);

test('displays the application name', () => {
  render(<App />);

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Stone Shelter');
});

test('renders the initial 8 stones with required content and total count', () => {
  render(<App />);
  expect(screen.getAllByRole('article')).toHaveLength(8);
  expect(screen.getByText((_, element) => element?.textContent === 'Found 30 stones' && element.tagName === 'P').textContent).toBe('Found 30 stones');
  for (const stone of [...mockStones].reverse().slice(0, 8)) {
    expect(screen.getByRole('heading', { name: stone.name }).textContent).toBe(stone.name);
    expect(screen.getByAltText(`Photo coming soon for ${stone.name}`).getAttribute('src')).toBe('/placeholder-rock.png');
  }
  expect(screen.getAllByText('Type')).toHaveLength(8);
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByText('Size')).toHaveLength(8);
  expect(screen.getAllByText(mockStones[29].biography!)).toHaveLength(8);
});

test('keeps navigation static and excludes catalog actions', () => {
  render(<App />);
  expect(screen.getByRole('navigation', { name: 'Main navigation' }).textContent).toContain('Stone catalog');
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(within(screen.getByRole('navigation', { name: 'Main navigation' })).queryAllByRole('button')).toHaveLength(0);
  expect(screen.queryByRole('button', { name: /adopt|favorite|details/i })).toBeNull();
});

test('uses a supplied photo and falls back when it cannot load', () => {
  render(<StoneCard stone={{ ...mockStones[0], photo: '/missing-stone.png' }} />);
  const photo = screen.getByAltText('Mars');
  expect(photo.getAttribute('src')).toBe('/missing-stone.png');
  fireEvent.error(photo);
  expect(photo.getAttribute('src')).toBe('/placeholder-rock.png');
});


test('traverses every stone across pages with boundary controls', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
  const names: string[] = [];
  for (let page = 1; page <= 3; page++) {
    fireEvent.click(screen.getByRole('button', { name: `Page ${page}` }));
    expect(screen.getAllByRole('article')).toHaveLength(page === 3 ? 6 : 12);
    names.push(...within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 }).map(h => h.textContent!));
    expect(screen.getByRole('button', { name: `Page ${page}` }).getAttribute('aria-current')).toBe('page');
  }
  expect(names).toEqual([...mockStones].reverse().map(stone => stone.name));
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(screen.getByRole('heading', { name: 'Orion' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('article')).toHaveLength(6);
});

test('changes page size to 24 and resets to the first page', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '24' } });
  expect(screen.getAllByRole('article')).toHaveLength(24);
  expect(screen.getByRole('heading', { name: 'Meadow' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('article')).toHaveLength(6);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByRole('heading', { name: 'Meadow' })).toBeTruthy();
});


test('sort selection resets page, preserves size and remains selected during navigation', () => {
  render(<App />);
  const sort = screen.getByRole('combobox', { name: 'Sort stones' });
  expect((sort as HTMLSelectElement).value).toBe('NEWEST');
  expect(within(sort).getAllByRole('option').map(option => option.textContent)).toEqual([
    'Newest first', 'Oldest first', 'Name: A–Z', 'Name: Z–A',
    'Size: small to large', 'Size: large to small',
  ]);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '24' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.change(sort, { target: { value: 'OLDEST' } });
  expect(screen.getAllByRole('article')).toHaveLength(24);
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Fern');
  expect((sort as HTMLSelectElement).value).toBe('OLDEST');
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  expect((sort as HTMLSelectElement).value).toBe('OLDEST');
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  fireEvent.change(sort, { target: { value: 'NAME_ASC' } });
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Ash');
  fireEvent.change(sort, { target: { value: 'NAME_DESC' } });
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Wren');
  fireEvent.change(sort, { target: { value: 'SIZE_ASC' } });
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  fireEvent.change(sort, { target: { value: 'SIZE_DESC' } });
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 })[0].textContent).toBe('Luna');
});


test('combines size/type selections, counts groups and resets while collapsed', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '24' } });
  fireEvent.change(screen.getByLabelText('Sort stones'), { target: { value: 'OLDEST' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Small' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Medium' }));
  expect(screen.getAllByRole('article')).toHaveLength(20);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Basalt' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Granite' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Obsidian' }));
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-01' } });
  expect(screen.getAllByRole('article')).toHaveLength(6);
  fireEvent.click(screen.getByRole('button', { name: 'Collapse filters' }));
  expect(screen.getByLabelText('3 active filter groups').textContent).toBe('3');
  expect(screen.queryByRole('checkbox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByLabelText('0 active filter groups').textContent).toBe('0');
  expect(screen.getAllByRole('article')).toHaveLength(24);
  expect((screen.getByLabelText('Sort stones') as HTMLSelectElement).value).toBe('OLDEST');
  expect(screen.getByRole('button', { name: 'Expand filters' })).toBeTruthy();
});

test('invalid date draft preserves applied range and page until corrected or reset', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
  const previousNames = within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 }).map(h => h.textContent);
  fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } });
  expect(screen.getByRole('alert').textContent).toBe('From must be on or before To.');
  expect(screen.getByLabelText('To').getAttribute('aria-invalid')).toBe('true');
  expect(within(screen.getByRole('main', { name: 'Stone catalog' })).getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(previousNames);
  expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Small' }));
  expect(screen.getAllByRole('article')).toHaveLength(7);
  fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-10' } });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'River' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-09-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Collapse filters' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  fireEvent.click(screen.getByRole('button', { name: 'Expand filters' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect((screen.getByLabelText('From') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('To') as HTMLInputElement).value).toBe('');
});

test('empty matches disable navigation and retain reset; sort and paging preserve filters', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Small' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Medium' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('article')).toHaveLength(8);
  fireEvent.change(screen.getByLabelText('Sort stones'), { target: { value: 'OLDEST' } });
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByRole('heading', { name: 'Mars' })).toBeTruthy();
  expect((screen.getByRole('checkbox', { name: 'Small' }) as HTMLInputElement).checked).toBe(true);
  fireEvent.change(screen.getByLabelText('From'), { target: { value: '2030-01-01' } });
  expect(screen.queryAllByRole('article')).toHaveLength(0);
  expect(screen.getByRole('status').textContent).toContain('No stones match');
  expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getAllByRole('article')).toHaveLength(12);
});


test('defaults to eight cards and offers 8, 12 and 24 with complete traversal', () => {
  render(<App />);
  const size = screen.getByLabelText('Stones per page');
  expect((size as HTMLSelectElement).value).toBe('8');
  expect(within(size).getAllByRole('option').map(option => option.textContent)).toEqual(['8', '12', '24']);
  const names: string[] = [];
  for (let page = 1; page <= 4; page++) {
    fireEvent.click(screen.getByRole('button', { name: `Page ${page}` }));
    expect(screen.getAllByRole('article')).toHaveLength(page === 4 ? 6 : 8);
    names.push(...within(screen.getByRole('main')).getAllByRole('heading', { level: 2 }).map(h => h.textContent!));
  }
  expect(names).toEqual([...mockStones].reverse().map(stone => stone.name));
});
