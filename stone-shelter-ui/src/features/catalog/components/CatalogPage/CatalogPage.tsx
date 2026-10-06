import { Catalog } from '../Catalog/Catalog';
import { useCatalog } from '../../hooks/useCatalog';

export function CatalogPage() {
  const { response, onPageChange, onSizeChange, sortOption, onSortChange } = useCatalog();
  return <Catalog sortOption={sortOption} onSortChange={onSortChange} response={response} onPageChange={onPageChange} onSizeChange={onSizeChange} />;
}
