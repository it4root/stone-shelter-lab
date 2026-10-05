import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App } from './App';
import { StoneCard } from '../components/StoneCard/StoneCard';
import { mockStones } from '../mockStones';

afterEach(cleanup);

test('displays the application name', () => {
  render(<App />);

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Stone Shelter');
});

test('renders the initial 12 stones with required content and total count', () => {
  render(<App />);
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByText((_, element) => element?.textContent === 'Found 30 stones' && element.tagName === 'P').textContent).toBe('Found 30 stones');
  for (const stone of mockStones.slice(0, 12)) {
    expect(screen.getByRole('heading', { name: stone.name }).textContent).toBe(stone.name);
    expect(screen.getByAltText(`Photo coming soon for ${stone.name}`).getAttribute('src')).toBe('/placeholder-rock.png');
  }
  expect(screen.getAllByText('Type')).toHaveLength(12);
  expect(screen.getAllByText('Size')).toHaveLength(12);
  expect(screen.getAllByText(mockStones[0].biography!)).toHaveLength(10);
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
  expect(names).toEqual(mockStones.map(stone => stone.name));
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
  expect(screen.getByRole('heading', { name: 'Mars' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('article')).toHaveLength(6);
  fireEvent.change(screen.getByLabelText('Stones per page'), { target: { value: '12' } });
  expect(screen.getAllByRole('article')).toHaveLength(12);
  expect(screen.getByRole('heading', { name: 'Mars' })).toBeTruthy();
});
