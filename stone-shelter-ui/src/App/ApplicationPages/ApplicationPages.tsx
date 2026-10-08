import { CatalogPage } from '../../features/catalog/components/CatalogPage/CatalogPage';
import { StoneDetailsPage } from '../../features/stone-details/components/StoneDetailsPage/StoneDetailsPage';
import { usePageNavigation } from '../navigation/usePageNavigation';
import { AddStonePage } from '../../features/add-stone/components/AddStonePage/AddStonePage';
import { useCatalogSession } from '../../features/catalog/state/CatalogSessionProvider/CatalogSessionProvider';
import { resolvePageRoute } from '../navigation/pageRoutes';
import { PageNotFound } from '../PageNotFound/PageNotFound';

export function ApplicationPages() {
  const { pathname } = usePageNavigation();
  const { refreshCatalog } = useCatalogSession();
  const route = resolvePageRoute(pathname);

  return (
    <>
      {route.page === 'catalog' ? <CatalogPage />
        : route.page === 'add-stone' ? <AddStonePage key={pathname} onCreated={refreshCatalog} />
          : route.page === 'stone-details' ? <StoneDetailsPage key={pathname} id={route.id} />
            : <PageNotFound />}
    </>
  );
}
