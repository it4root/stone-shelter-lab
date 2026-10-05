import { getMockCatalogStones } from '../mocks/api/mockStonesApi';
import type { StonesSearchResponse } from './dto/StonesSearchResponse';

// Local mock adapter; HTTP integration is outside the current feature scope.
export const getCatalogStones: (page?: number, size?: number) => StonesSearchResponse = getMockCatalogStones;
