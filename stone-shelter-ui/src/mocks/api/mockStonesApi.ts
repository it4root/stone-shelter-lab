import { mockStones } from '../data/stones';
import type { StonesSearchResponse } from '../../api/dto/StonesSearchResponse';

import type { SearchSort } from '../../api/dto/SearchSort';
import type { StoneSize } from '../../enums/StoneSize';

const sizeRanks: Record<StoneSize, number> = { SMALL: 0, MEDIUM: 1, LARGE: 2 };

export function getMockCatalogStones(page = 0, size = 12,
  sort: SearchSort = { field: 'admissionDate', direction: 'desc' }): StonesSearchResponse {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 24) {
    throw new RangeError('Page must be nonnegative and page size must be between 1 and 24.');
  }
  const sortedStones = [...mockStones].sort((left, right) => {
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
    content: sortedStones.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: mockStones.length,
  };
}
