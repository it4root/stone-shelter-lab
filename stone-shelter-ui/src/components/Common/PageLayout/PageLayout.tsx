import type { ReactNode } from 'react';
import './PageLayout.css';

export function PageLayout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return (
    <div className="page-layout">
      <aside className="filters-space" aria-label="Catalog filters">{sidebar}</aside>
      {children}
      <aside className="future-space chat-space" aria-label="Space reserved for a future chatbot" />
    </div>
  );
}
