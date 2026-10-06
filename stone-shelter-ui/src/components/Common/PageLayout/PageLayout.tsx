import type { ReactNode } from 'react';
import './PageLayout.css';

export function PageLayout({ children, sidebar, sidebarOpen, toolbar }: { children: ReactNode; sidebar: ReactNode; sidebarOpen: boolean; toolbar?: ReactNode }) {
  return (
    <div className={`page-layout${sidebarOpen ? " sidebar-visible" : ""}`}>
      <aside className="filters-space" aria-label="Catalog filters">{sidebar}</aside>
      <div className="catalog-slot">{toolbar}{children}</div>
      <aside className="future-space chat-space" aria-label="Space reserved for a future chatbot" />
    </div>
  );
}
