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

test('renders the initial 12 stones with required content and total count', () => {
  render(<App />);
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByText((_, element) => element?.textContent === 'Found 30 stones' && element.tagName === 'P').textContent).toBe('Found 30 stones');
  for (const stone of [...mockStones].reverse().slice(0, 12)) {
    expect(screen.getByRole('heading', { name: stone.name }).textContent).toBe(stone.name);
    expect(screen.getByAltText(`Photo coming soon for ${stone.name}`).getAttribute('src')).toBe('/placeholder-rock.png');
  }
  expect(screen.getAllByText('Type')).toHaveLength(12);
  expect(screen.getAllByText('Size')).toHaveLength(12);
  expect(screen.getAllByText(mockStones[29].biography!)).toHaveLength(10);
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
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
  const names: string[] = [];
  for (let page = 1; page <= 3; page++) {
    fireEvent.click(screen.getByRole('button', { name: `Page ${page}` }));
    expect(screen.getAllByRole('article')).toHaveLength(page === 3 ? 6 : 12);
    names.push(...screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent!));
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
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Fern');
  expect((sort as HTMLSelectElement).value).toBe('OLDEST');
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  expect((sort as HTMLSelectElement).value).toBe('OLDEST');
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  fireEvent.change(sort, { target: { value: 'NAME_ASC' } });
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Ash');
  fireEvent.change(sort, { target: { value: 'NAME_DESC' } });
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Wren');
  fireEvent.change(sort, { target: { value: 'SIZE_ASC' } });
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Mars');
  fireEvent.change(sort, { target: { value: 'SIZE_DESC' } });
  expect(screen.getAllByRole('heading', { level: 2 })[0].textContent).toBe('Luna');
});
