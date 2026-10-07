import { mockStones } from '../data/stones';
import { mockStonePhotos } from '../data/stonePhotos';
import type { StoneResponse } from '../../api/dto/StoneResponse';
import type { StoneReservationCreateRequest } from '../../api/dto/StoneReservationCreateRequest';
import type { StoneReservationCreateResponse } from '../../api/dto/StoneReservationCreateResponse';
import type { StoneSearchResponse } from '../../api/dto/StoneSearchResponse';
import { StoneReservationError } from '../../api/StoneReservationError';
import type { StonesSearchResponse } from '../../api/dto/StonesSearchResponse';

import type { SearchSort } from '../../api/dto/SearchSort';
import type { StoneSize } from '../../enums/StoneSize';

import type { StoneSearchFilter } from '../../api/dto/StoneSearchFilter';

const sizeRanks: Record<StoneSize, number> = { SMALL: 0, MEDIUM: 1, LARGE: 2 };

const reservations = new Map<number, {
  request: StoneReservationCreateRequest;
  response: StoneReservationCreateResponse;
}>();
let nextReservationId = 1;

export function resetMockStoneReservations() {
  reservations.clear();
  nextReservationId = 1;
}

function withReservation(stone: StoneSearchResponse): StoneSearchResponse {
  return { ...stone, adoptionStatus: reservations.get(stone.id)?.response.adoptionStatus ?? stone.adoptionStatus };
}

export async function createMockStoneReservation(id: number, request: StoneReservationCreateRequest): Promise<StoneReservationCreateResponse> {
  if (typeof request.applicantName !== 'string' || !request.applicantName.trim()
      || typeof request.contactDetails !== 'string' || !request.contactDetails.trim()) {
    throw new StoneReservationError(400, 'Your name and contact details are required.');
  }
  const stone = getMockStone(id);
  if (!stone) throw new StoneReservationError(404, 'This stone could not be found.');
  if (stone.adoptionStatus !== 'AVAILABLE' || reservations.has(id)) {
    throw new StoneReservationError(409, 'This stone is no longer available for reservation.');
  }
  const response: StoneReservationCreateResponse = {
    id: nextReservationId++, stoneId: id, adoptionStatus: 'RESERVED', createdAt: new Date().toISOString(),
  };
  reservations.set(id, { request: { ...request }, response });
  return { ...response };
}

export function getMockCatalogStones(page = 0, size = 8,
  sort: SearchSort = { field: 'admissionDate', direction: 'desc' }, filter: StoneSearchFilter = {}): StonesSearchResponse {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 24) {
    throw new RangeError('Page must be nonnegative and page size must be between 1 and 24.');
  }
  const matchingStones = mockStones.map(withReservation).filter(stone => {
    const timestamp = Date.parse(stone.admissionDate);
    return (!filter.stoneSizes?.length || filter.stoneSizes.includes(stone.stoneSize))
      && (!filter.stoneTypes?.length || filter.stoneTypes.includes(stone.stoneType))
      && (!filter.stoneSize || filter.stoneSize === stone.stoneSize)
      && (!filter.stoneType || filter.stoneType === stone.stoneType)
      && (!filter.adoptionStatus || filter.adoptionStatus === stone.adoptionStatus)
      && (!filter.admissionDateFrom || timestamp >= Date.parse(`${filter.admissionDateFrom}T00:00:00Z`))
      && (!filter.admissionDateTo || timestamp < Date.parse(`${filter.admissionDateTo}T00:00:00Z`) + 86400000);
  });
  const sortedStones = matchingStones.sort((left, right) => {
    let comparison: number;
    switch (sort.field) {
      case 'stoneSize':
        comparison = sizeRanks[left.stoneSize] - sizeRanks[right.stoneSize];
        break;
      case 'admissionDate':
        comparison = Date.parse(left.admissionDate) - Date.parse(right.admissionDate);
        break;
      case 'name':
        comparison = left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
        break;
    }
    return (sort.direction === 'desc' ? -comparison : comparison) || left.id - right.id;
  });
  return {
    content: sortedStones.slice(page * size, (page + 1) * size).map(stone => ({
      ...stone,
      photo: mockStonePhotos[stone.id]?.[0]?.url ?? stone.photo,
    })),
    page,
    size,
    totalElements: matchingStones.length,
  };
}

export function getMockStone(id: number): StoneResponse | undefined {
  const stone = mockStones.find(stone => stone.id === id);
  if (!stone) return undefined;
  const photos = (mockStonePhotos[id] ?? []).map(photo => ({ ...photo }));
  return { ...withReservation(stone), photo: photos[0]?.url ?? stone.photo, photos };
}
