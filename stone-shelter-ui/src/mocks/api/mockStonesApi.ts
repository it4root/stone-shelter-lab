import { mockStones } from '../data/stones';
import type { StonesSearchResponse } from '../../api/dto/StonesSearchResponse';

export function getMockCatalogStones(page = 0, size = 12): StonesSearchResponse {
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 24) {
    throw new RangeError('Page must be nonnegative and page size must be between 1 and 24.');
  }
  return {
    content: mockStones.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: mockStones.length,
  };
}
