import { CatalogPage } from '../../features/catalog/components/CatalogPage/CatalogPage';
import { StoneDetailsPage } from '../../features/stone-details/components/StoneDetailsPage/StoneDetailsPage';
import { usePageNavigation } from '../navigation/usePageNavigation';
import { AddStonePage } from '../../features/add-stone/components/AddStonePage/AddStonePage';
import { useCatalogSession } from '../../features/catalog/state/CatalogSessionProvider/CatalogSessionProvider';

export function ApplicationPages() {
  const { pathname, onNavigate } = usePageNavigation();
  const { refreshCatalog } = useCatalogSession();
  const match = /^\/stones\/([1-9]\d*)\/?$/.exec(pathname);
  const id = match && Number.isSafeInteger(Number(match[1])) ? Number(match[1]) : undefined;

  return (
    <div onClick={onNavigate}>
      {pathname === '/' ? <CatalogPage />
        : /^\/stones\/new\/?$/.test(pathname) ? <AddStonePage key={pathname} onCreated={refreshCatalog} />
          : <StoneDetailsPage key={pathname} id={id} />}
    </div>
  );
}
