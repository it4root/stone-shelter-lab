import { createMockStone, createMockStoneReservation, getMockCatalogStones, getMockStone, uploadMockStonePhotoDraft } from '../mocks/api/mockStonesApi';
import type { StoneCreateRequest } from './dto/StoneCreateRequest';
import type { StoneCreateResponse } from './dto/StoneCreateResponse';
import type { StonePhotoDraftUploadResponse } from './dto/StonePhotoDraftUploadResponse';
import type { StoneReservationCreateRequest } from './dto/StoneReservationCreateRequest';
import type { StoneReservationCreateResponse } from './dto/StoneReservationCreateResponse';
import type { StoneResponse } from './dto/StoneResponse';
import type { StonesSearchResponse } from './dto/StonesSearchResponse';

import type { SearchSort } from './dto/SearchSort';

import type { StoneSearchFilter } from './dto/StoneSearchFilter';

// Local mock adapter; HTTP integration is outside the current feature scope.
export const getCatalogStones: (page?: number, size?: number, sort?: SearchSort, filter?: StoneSearchFilter) => StonesSearchResponse = getMockCatalogStones;
export const getStone: (id: number) => StoneResponse | undefined = getMockStone;
export const createStoneReservation: (id: number, request: StoneReservationCreateRequest) => Promise<StoneReservationCreateResponse> = createMockStoneReservation;
export const createStone: (request: StoneCreateRequest) => Promise<StoneCreateResponse> = createMockStone;
export const uploadStonePhotoDraft: (file: File) => Promise<StonePhotoDraftUploadResponse> = uploadMockStonePhotoDraft;
