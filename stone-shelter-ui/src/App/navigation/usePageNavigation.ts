import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';

export function usePageNavigation() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const currentPath = useRef(pathname);
  const catalogScroll = useRef(0);

  useEffect(() => {
    const scrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    function changePage() {
      if (currentPath.current === '/') catalogScroll.current = window.scrollY;
      currentPath.current = window.location.pathname;
      setPathname(window.location.pathname);
    }
    window.addEventListener('popstate', changePage);
    return () => {
      window.removeEventListener('popstate', changePage);
      window.history.scrollRestoration = scrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: pathname === '/' ? catalogScroll.current : 0, behavior: 'instant' });
  }, [pathname]);

  function onNavigate(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest('a');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || (url.pathname !== '/' && !url.pathname.startsWith('/stones/'))) return;
    event.preventDefault();
    if (currentPath.current === '/') catalogScroll.current = window.scrollY;
    if (url.pathname === currentPath.current) return;
    window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
    currentPath.current = url.pathname;
    setPathname(url.pathname);
  }

  return { pathname, onNavigate };
}
