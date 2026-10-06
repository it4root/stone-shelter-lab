import { useState } from 'react';
import { getCatalogStones } from '../../../api/stonesApi';

import type { CatalogSortOption } from '../../../enums/CatalogSortOption';
import { catalogSortOptions } from '../presentation/catalogSortOptions';

export function useCatalog() {
  const [sortOption, setSortOption] = useState<CatalogSortOption>('NEWEST');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);

  function changeSize(nextSize: number) {
    setSize(nextSize);
    setPage(0);
  }

  function changeSort(nextSort: CatalogSortOption) {
    setSortOption(nextSort);
    setPage(0);
  }

  return {
    sortOption,
    onSortChange: changeSort,
    response: getCatalogStones(page, size, catalogSortOptions[sortOption].sort),
    onPageChange: setPage,
    onSizeChange: changeSize,
  };
}
