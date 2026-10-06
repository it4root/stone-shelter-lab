import type { StonesSearchResponse } from '../../../../api/dto/StonesSearchResponse';
import { StoneCard } from '../../../../domain/stone/components/StoneCard/StoneCard';
import { Pagination } from '../../../../components/Common/Pagination/Pagination';

import type { CatalogSortOption } from '../../../../enums/CatalogSortOption';
import { CatalogSort } from '../CatalogSort/CatalogSort';
import './Catalog.css';

interface CatalogProps {
  sortOption: CatalogSortOption;
  onSortChange: (value: CatalogSortOption) => void;
  response: StonesSearchResponse;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export function Catalog({ response, onPageChange, onSizeChange, sortOption, onSortChange }: CatalogProps) {
  return (
    <main className="catalog" aria-label="Stone catalog">
      <div className="catalog-heading"><p>Found <strong>{response.totalElements}</strong> stones</p><CatalogSort value={sortOption} onChange={onSortChange} /></div>
      <div className="catalog-grid">{response.content.map((stone) => <StoneCard key={stone.id} stone={stone} />)}</div>
      <Pagination page={response.page} size={response.size} totalElements={response.totalElements}
        onPageChange={onPageChange} onSizeChange={onSizeChange} />
    </main>
  );
}
