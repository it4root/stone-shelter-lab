import { useState } from 'react';
import { getCatalogStones } from '../../../api/stonesApi';

export function useCatalog() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);

  function changeSize(nextSize: number) {
    setSize(nextSize);
    setPage(0);
  }

  return {
    response: getCatalogStones(page, size),
    onPageChange: setPage,
    onSizeChange: changeSize,
  };
}
