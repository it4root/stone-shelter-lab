import { useCallback, useState } from 'react';
import { getCatalogStones } from '../../../api/stonesApi';

import type { CatalogSortOption } from '../../../enums/CatalogSortOption';
import { catalogSortOptions } from '../presentation/catalogSortOptions';

import type { StoneSearchFilter } from '../../../api/dto/StoneSearchFilter';
import type { StoneSize } from '../../../enums/StoneSize';
import type { StoneType } from '../../../enums/StoneType';
import { validateAdmissionDates } from '../validation/admissionDates';

export function useCatalog() {
  const [filter, setFilter] = useState<StoneSearchFilter>({});
  const [dateDraft, setDateDraft] = useState({ from: '', to: '' });
  const [dateError, setDateError] = useState<string>();
  const [filtersExpanded, setFiltersExpanded] = useState(() => window.innerWidth >= 960);
  const [sortOption, setSortOption] = useState<CatalogSortOption>('NEWEST');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(8);

  function changeSize(nextSize: number) {
    setSize(nextSize);
    setPage(0);
  }

  function changeSort(nextSort: CatalogSortOption) {
    setSortOption(nextSort);
    setPage(0);
  }

  function changeSizes(values: StoneSize[]) {
    setFilter(current => ({ ...current, stoneSizes: values }));
    setPage(0);
  }

  function changeTypes(values: StoneType[]) {
    setFilter(current => ({ ...current, stoneTypes: values }));
    setPage(0);
  }

  function changeDates(from: string, to: string, badInput = false) {
    setDateDraft({ from, to });
    const error = badInput ? 'Enter a valid date in YYYY-MM-DD format.' : validateAdmissionDates(from, to);
    setDateError(error);
    if (!error) {
      setFilter(current => ({ ...current, admissionDateFrom: from || undefined, admissionDateTo: to || undefined }));
      setPage(0);
    }
  }

  function resetFilters() {
    setFilter({});
    setDateDraft({ from: '', to: '' });
    setDateError(undefined);
    setPage(0);
  }

  const closeFilters = useCallback(() => setFiltersExpanded(false), []);

  return {
    filter,
    dateDraft,
    dateError,
    filtersExpanded,
    onOpenFilters: () => setFiltersExpanded(true),
    onCloseFilters: closeFilters,
    onSizesChange: changeSizes,
    onTypesChange: changeTypes,
    onDatesChange: changeDates,
    onResetFilters: resetFilters,
    activeFilterGroups: Number(Boolean(filter.stoneSizes?.length))
      + Number(Boolean(filter.stoneTypes?.length))
      + Number(Boolean(filter.admissionDateFrom || filter.admissionDateTo)),
    sortOption,
    onSortChange: changeSort,
    response: getCatalogStones(page, size, catalogSortOptions[sortOption].sort, filter),
    onPageChange: setPage,
    onSizeChange: changeSize,
  };
}
