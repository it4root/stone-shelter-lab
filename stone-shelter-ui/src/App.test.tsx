import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { App, StoneCard } from './App';
import { mockStones } from './mockStones';

afterEach(cleanup);

test('displays the application name', () => {
  render(<App />);

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Stone Shelter');
});

test('renders all 30 stones with required catalog content and photo fallback', () => {
  render(<App />);
  expect(screen.getAllByRole('article')).toHaveLength(30);
  expect(screen.getByText((_, element) => element?.textContent === 'Found 30 stones' && element.tagName === 'P').textContent).toBe('Found 30 stones');
  for (const stone of mockStones) {
    expect(screen.getByRole('heading', { name: stone.name }).textContent).toBe(stone.name);
    expect(screen.getByAltText(`Photo coming soon for ${stone.name}`).getAttribute('src')).toBe('/placeholder-rock.png');
  }
  expect(screen.getAllByText('Type')).toHaveLength(30);
  expect(screen.getAllByText('Size')).toHaveLength(30);
  expect(screen.getAllByText(mockStones[0].biography!)).toHaveLength(10);
});

test('keeps navigation static and excludes catalog actions', () => {
  render(<App />);
  expect(screen.getByRole('navigation').textContent).toContain('Stone catalog');
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});

test('uses a supplied photo and falls back when it cannot load', () => {
  render(<StoneCard stone={{ ...mockStones[0], photo: '/missing-stone.png' }} />);
  const photo = screen.getByAltText('Mars');
  expect(photo.getAttribute('src')).toBe('/missing-stone.png');
  fireEvent.error(photo);
  expect(photo.getAttribute('src')).toBe('/placeholder-rock.png');
});
