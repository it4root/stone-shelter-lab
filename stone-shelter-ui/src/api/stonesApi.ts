import { getMockCatalogStones } from '../mocks/api/mockStonesApi';
import type { StonesSearchResponse } from './dto/StonesSearchResponse';

import type { SearchSort } from './dto/SearchSort';

import type { StoneSearchFilter } from './dto/StoneSearchFilter';

// Local mock adapter; HTTP integration is outside the current feature scope.
export const getCatalogStones: (page?: number, size?: number, sort?: SearchSort, filter?: StoneSearchFilter) => StonesSearchResponse = getMockCatalogStones;
