import { useId } from 'react';
import type { StoneSearchFilter } from '../../../../api/dto/StoneSearchFilter';
import type { StoneSize } from '../../../../enums/StoneSize';
import type { StoneType } from '../../../../enums/StoneType';
import { stoneSizeLabels, stoneTypeLabels } from '../../../../domain/stone/presentation/stoneLabels';
import './CatalogFilters.css';

interface CatalogFiltersProps {
  filter: StoneSearchFilter;
  dateDraft: { from: string; to: string };
  dateError?: string;
  onSizesChange: (values: StoneSize[]) => void;
  onTypesChange: (values: StoneType[]) => void;
  onDatesChange: (from: string, to: string, badInput?: boolean) => void;
  onResetFilters: () => void;
}

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export function CatalogFilters(props: CatalogFiltersProps) {
  const errorId = useId();
  return (
    <section className="catalog-filters" aria-label="Filters">
        <fieldset><legend>Size</legend>
          {(Object.keys(stoneSizeLabels) as StoneSize[]).map(value => (
            <label key={value}><input type="checkbox" checked={props.filter.stoneSizes?.includes(value) ?? false}
              onChange={() => props.onSizesChange(toggleValue(props.filter.stoneSizes ?? [], value))} />{stoneSizeLabels[value]}</label>
          ))}
        </fieldset>
        <fieldset><legend>Stone type</legend>
          {(Object.keys(stoneTypeLabels) as StoneType[]).map(value => (
            <label key={value}><input type="checkbox" checked={props.filter.stoneTypes?.includes(value) ?? false}
              onChange={() => props.onTypesChange(toggleValue(props.filter.stoneTypes ?? [], value))} />{stoneTypeLabels[value]}</label>
          ))}
        </fieldset>
        <fieldset className="date-fields"><legend>Admission date</legend>
          <label>From<input type="date" value={props.dateDraft.from} aria-invalid={Boolean(props.dateError)}
            aria-describedby={props.dateError ? errorId : undefined}
            onChange={event => props.onDatesChange(event.target.value, props.dateDraft.to, event.target.validity.badInput)} /></label>
          <label>To<input type="date" value={props.dateDraft.to} aria-invalid={Boolean(props.dateError)}
            aria-describedby={props.dateError ? errorId : undefined}
            onChange={event => props.onDatesChange(props.dateDraft.from, event.target.value, event.target.validity.badInput)} /></label>
          {props.dateError && <p id={errorId} className="date-error" role="alert">{props.dateError}</p>}
        </fieldset>
      <button type="button" className="reset-filters" onClick={props.onResetFilters}>Reset filters</button>
    </section>
  );
}
