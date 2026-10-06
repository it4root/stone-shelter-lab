import { expect, test } from 'vitest';
import { getCatalogStones, getStone } from '../../api/stonesApi';
import { mockStones } from '../data/stones';

test('looks up the same 30 identities independently of catalog paging or filters', () => {
  expect(getCatalogStones(0, 8, undefined, { stoneSizes: ['LARGE'] }).content.some(stone => stone.id === 1)).toBe(false);
  for (const stone of mockStones) expect(getStone(stone.id)).toMatchObject(stone);
  expect(getStone(999)).toBeUndefined();
  expect(getStone(NaN)).toBeUndefined();
});

test('projects the first added cover consistently for empty, single and overflowing galleries', () => {
  expect(getStone(1)?.photos).toHaveLength(6);
  expect(getStone(2)?.photos).toHaveLength(1);
  expect(getStone(3)?.photos).toHaveLength(0);
  const stones = getCatalogStones(0, 24, { field: 'admissionDate', direction: 'asc' }).content;
  for (const stone of stones) {
    const detail = getStone(stone.id)!;
    expect(stone.photo).toBe(detail.photos[0]?.url ?? mockStones.find(item => item.id === stone.id)?.photo);
    expect(detail.photos.map(photo => photo.position)).toEqual(detail.photos.map((_, index) => index));
    expect(new Set(detail.photos.map(photo => photo.id)).size).toBe(detail.photos.length);
    expect(detail.photos.every(photo => photo.url === '/placeholder-rock.png')).toBe(true);
  }
});

test('returns independent photo metadata without allowing a preview to mutate fixtures', () => {
  const detail = getStone(1)!;
  detail.photos.reverse();
  detail.photos[0].url = '/changed.png';
  expect(getStone(1)?.photos[0]).toMatchObject({ position: 0, url: '/placeholder-rock.png' });
});
