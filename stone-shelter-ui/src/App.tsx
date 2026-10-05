import { mockStones, type StoneSearchResponse } from './mockStones';
import './App.css';

const placeholder = '/placeholder-rock.png';
const navigation = ['Stone catalog', 'How it works', 'About the shelter', 'Blog', 'Contact'];

function displayLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function StoneCard({ stone }: { stone: StoneSearchResponse }) {
  return (
    <article className="stone-card" aria-labelledby={`stone-${stone.id}`}>
      <img
        className="stone-photo"
        src={stone.photo || placeholder}
        alt={stone.photo ? stone.name : `Photo coming soon for ${stone.name}`}
        loading="lazy"
        onError={(event) => {
          if (event.currentTarget.getAttribute('src') !== placeholder) {
            event.currentTarget.src = placeholder;
          }
        }}
      />
      <div className="stone-content">
        <h2 id={`stone-${stone.id}`}>{stone.name}</h2>
        <dl className="stone-facts">
          <div><dt>Type</dt><dd>{displayLabel(stone.stoneType)}</dd></div>
          <div><dt>Size</dt><dd>{displayLabel(stone.stoneSize)}</dd></div>
        </dl>
        <p className="stone-biography">{stone.biography || 'This stone’s story is coming soon.'}</p>
      </div>
    </article>
  );
}

export function App() {
  return (
    <>
      <header className="site-header">
        <div className="brand">
          <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
            <path d="M5 21 24 5l19 16" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9 36 15 25 25 21 35 27 39 36 33 40H14Z" fill="#e1e3de" stroke="currentColor" strokeWidth="1.4" />
            <path d="m15 34 9-7 10 7" fill="none" stroke="#939c91" />
          </svg>
          <h1>Stone Shelter</h1>
        </div>
        <nav aria-label="Main navigation">
          <ul>{navigation.map((label, index) => (
            <li key={label} className={index === 0 ? 'current-section' : undefined}>{label}</li>
          ))}</ul>
        </nav>
      </header>
      <div className="page-layout">
        <aside className="future-space filters-space" aria-label="Space reserved for future filters" />
        <main className="catalog" aria-label="Stone catalog">
          <div className="catalog-heading"><p>Found <strong>{mockStones.length}</strong> stones</p></div>
          <div className="catalog-grid">{mockStones.map((stone) => <StoneCard key={stone.id} stone={stone} />)}</div>
        </main>
        <aside className="future-space chat-space" aria-label="Space reserved for a future chatbot" />
      </div>
    </>
  );
}
