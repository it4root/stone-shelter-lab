import { Catalog } from '../Catalog/Catalog';
import { useCatalog } from '../../hooks/useCatalog';

export function CatalogPage() {
  const { response, onPageChange, onSizeChange } = useCatalog();
  return <Catalog response={response} onPageChange={onPageChange} onSizeChange={onSizeChange} />;
}
