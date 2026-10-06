import { PageLayout } from '../../../../components/Common/PageLayout/PageLayout';
import { Catalog } from '../Catalog/Catalog';
import { CatalogFilters } from '../CatalogFilters/CatalogFilters';
import { useCatalog } from '../../hooks/useCatalog';

export function CatalogPage() {
  const catalog = useCatalog();
  return (
    <PageLayout sidebar={<CatalogFilters filter={catalog.filter} dateDraft={catalog.dateDraft}
      dateError={catalog.dateError} filtersExpanded={catalog.filtersExpanded}
      activeFilterGroups={catalog.activeFilterGroups} onToggleFilters={catalog.onToggleFilters}
      onSizesChange={catalog.onSizesChange} onTypesChange={catalog.onTypesChange}
      onDatesChange={catalog.onDatesChange} onResetFilters={catalog.onResetFilters} />}>
      <Catalog sortOption={catalog.sortOption} onSortChange={catalog.onSortChange}
        response={catalog.response} onPageChange={catalog.onPageChange} onSizeChange={catalog.onSizeChange} />
    </PageLayout>
  );
}
