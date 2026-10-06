import { CatalogPage } from '../../features/catalog/components/CatalogPage/CatalogPage';
import { StoneDetailsPage } from '../../features/stone-details/components/StoneDetailsPage/StoneDetailsPage';
import { usePageNavigation } from '../navigation/usePageNavigation';

export function ApplicationPages() {
  const { pathname, onNavigate } = usePageNavigation();
  const match = /^\/stones\/([1-9]\d*)\/?$/.exec(pathname);
  const id = match && Number.isSafeInteger(Number(match[1])) ? Number(match[1]) : undefined;

  return (
    <div onClick={onNavigate}>
      {pathname === '/' ? <CatalogPage /> : <StoneDetailsPage key={pathname} id={id} />}
    </div>
  );
}
