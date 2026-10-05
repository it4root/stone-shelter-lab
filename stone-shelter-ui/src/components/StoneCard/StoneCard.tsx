import type { StoneSearchResponse } from '../../stoneTypes';

const placeholder = '/placeholder-rock.png';

const stoneTypeLabels: Record<StoneSearchResponse['stoneType'], string> = {
  BASALT: 'Basalt', GRANITE: 'Granite', OBSIDIAN: 'Obsidian', PUMICE: 'Pumice',
  LIMESTONE: 'Limestone', SANDSTONE: 'Sandstone', SHALE: 'Shale', MARBLE: 'Marble',
  GNEISS: 'Gneiss', SLATE: 'Slate',
};
const stoneSizeLabels: Record<StoneSearchResponse['stoneSize'], string> = {
  SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large',
};

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
          <div><dt>Type</dt><dd>{stoneTypeLabels[stone.stoneType]}</dd></div>
          <div><dt>Size</dt><dd>{stoneSizeLabels[stone.stoneSize]}</dd></div>
        </dl>
        <p className="stone-biography">{stone.biography || 'This stone’s story is coming soon.'}</p>
      </div>
    </article>
  );
}

