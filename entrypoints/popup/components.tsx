import type { ReactElement } from 'react';

export interface SwitchProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/** Accessible toggle switch built on a native checkbox. */
export function Switch({ id, label, checked, onChange }: SwitchProps): ReactElement {
  return (
    <label className="switch-row" htmlFor={id}>
      <span className="switch-label">{label}</span>
      <span className={`switch ${checked ? 'switch--on' : ''}`}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-thumb" />
      </span>
    </label>
  );
}

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SegmentedProps<T extends string> {
  readonly label: string;
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

/** Segmented control matching the design mockup's pill button groups. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>): ReactElement {
  return (
    <div className="segmented">
      <span className="segmented-label">{label}</span>
      <div className="segmented-group" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={`segmented-btn ${option.value === value ? 'segmented-btn--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
