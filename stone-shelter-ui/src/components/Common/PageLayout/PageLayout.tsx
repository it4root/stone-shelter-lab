import type { ReactNode } from 'react';
import './PageLayout.css';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page-layout">
      <aside className="future-space filters-space" aria-label="Space reserved for future filters" />
      {children}
      <aside className="future-space chat-space" aria-label="Space reserved for a future chatbot" />
    </div>
  );
}
