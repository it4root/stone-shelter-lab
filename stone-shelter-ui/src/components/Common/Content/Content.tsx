import { useState } from 'react';
import { getCatalogStones } from '../../../catalogDataSource';
import { Catalog } from '../../Catalog/Catalog';

export function Content() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  return (
    <div className="page-layout">
      <aside className="future-space filters-space" aria-label="Space reserved for future filters" />
      <Catalog response={getCatalogStones(page, size)} onPageChange={setPage}
        onSizeChange={(nextSize) => { setSize(nextSize); setPage(0); }} />
      <aside className="future-space chat-space" aria-label="Space reserved for a future chatbot" />
    </div>
  );
}
