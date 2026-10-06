import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import type { StoneResponse } from '../../../../api/dto/StoneResponse';
import type { AdoptionStatus } from '../../../../enums/AdoptionStatus';
import { getStone } from '../../../../api/stonesApi';
import { StoneDetailsPage } from './StoneDetailsPage';

vi.mock('../../../../api/stonesApi', () => ({ getStone: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const stone: StoneResponse = {
  id: 7, name: 'Willow', stoneType: 'SHALE', stoneSize: 'SMALL',
  adoptionStatus: 'AVAILABLE', admissionDate: '2026-09-02T00:30:00+02:00',
  biography: 'A curious traveler with many stories.\n\nA second paragraph that remains fully readable.',
  photos: [],
};

test('shows contract-backed characteristics, UTC date and complete biography with its paragraph breaks', () => {
  vi.mocked(getStone).mockReturnValue(stone);
  render(<StoneDetailsPage id={7} />);
  const main = screen.getByRole('main', { name: 'Willow' });
  expect(within(main).getByRole('heading', { name: 'Willow' })).toBeTruthy();
  expect(screen.getByText('ID 7')).toBeTruthy();
  expect(screen.getByText('September 1, 2026')).toBeTruthy();
  expect(screen.getByText('Shale')).toBeTruthy();
  expect(screen.getByText('Small')).toBeTruthy();
  expect(document.querySelector('.stone-details-biography p')?.textContent).toBe(stone.biography);
  expect(screen.queryByRole('button', { name: /adopt|favorite|chat|upload/i })).toBeNull();
  expect(screen.queryByText(/weight|color|location|centimeters|found in nature/i)).toBeNull();
});

test.each([
  ['AVAILABLE', 'Available'], ['RESERVED', 'Reserved'], ['ADOPTED', 'Adopted'],
] as [AdoptionStatus, string][])('renders the actual %s status without hiding its stone', (adoptionStatus, label) => {
  vi.mocked(getStone).mockReturnValue({ ...stone, adoptionStatus, biography: '  ' });
  render(<StoneDetailsPage id={7} />);
  expect(screen.getByText(label)).toBeTruthy();
  expect(screen.getByText('This stone’s story is coming soon.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Back to catalog' }).getAttribute('href')).toBe('/');
});

test('accepts explicit null legacy photo and biography from the backend without fabricating gallery entries', () => {
  vi.mocked(getStone).mockReturnValue({ ...stone, photo: null, biography: null });
  render(<StoneDetailsPage id={7} />);
  expect(screen.getByRole('img', { name: 'Photo coming soon for Willow' }).getAttribute('src')).toBe('/placeholder-rock.png');
  expect(screen.getByText('This stone’s story is coming soon.')).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Photo thumbnails' })).toBeNull();
  expect(screen.queryByRole('button', { name: /photos/ })).toBeNull();
});
