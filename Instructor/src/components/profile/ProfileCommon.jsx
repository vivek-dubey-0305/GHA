import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

export const cardClass = 'bg-[#111] border border-gray-800 rounded-xl p-5 sm:p-6';
export const inputClass = 'w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600';
export const textClass = 'text-gray-300 text-sm';
export const labelClass = 'block text-xs font-medium tracking-wide text-gray-500 mb-1.5';

export function SectionCard({ title, subtitle, icon: Icon, children }) {
  return (
    <div className={cardClass}>
      <div className="mb-4">
        <div className="flex items-center gap-2 text-white">
          {Icon ? <Icon className="w-4 h-4" /> : null}
          <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
        </div>
        {subtitle ? <p className="text-gray-500 text-xs mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = 'text', min = 0, max, step = 1 }) {
  const handleNumberChange = (rawValue) => {
    if (rawValue === '') {
      onChange('');
      return;
    }

    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) return;

    let nextValue = numericValue;
    if (typeof min === 'number') nextValue = Math.max(min, nextValue);
    if (typeof max === 'number') nextValue = Math.min(max, nextValue);

    onChange(String(nextValue));
  };

  const stepNumber = (direction) => {
    const currentNumeric = Number(value ?? 0);
    const safeCurrent = Number.isNaN(currentNumeric) ? 0 : currentNumeric;
    let nextValue = safeCurrent + direction * step;

    if (typeof min === 'number') nextValue = Math.max(min, nextValue);
    if (typeof max === 'number') nextValue = Math.min(max, nextValue);

    onChange(String(nextValue));
  };

  if (type === 'number') {
    return (
      <div>
        <label className={labelClass}>{label}</label>
        <div className="relative">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value ?? ''}
            onChange={(event) => handleNumberChange(event.target.value)}
            placeholder={placeholder}
            className={`${inputClass} profile-number-input pr-11`}
          />
          <div className="absolute right-1 top-1 bottom-1 w-9 flex flex-col overflow-hidden rounded-md border border-gray-700 bg-[#141414]">
            <button
              type="button"
              onClick={() => stepNumber(1)}
              className="h-1/2 flex items-center justify-center text-gray-300 hover:bg-[#1b1b1b] transition-colors border-b border-gray-700"
              aria-label={`Increase ${label}`}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => stepNumber(-1)}
              className="h-1/2 flex items-center justify-center text-gray-300 hover:bg-[#1b1b1b] transition-colors"
              aria-label={`Decrease ${label}`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, maxLength }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={`${inputClass} resize-y`}
      />
      {maxLength ? <p className="text-[11px] text-gray-600 mt-1">{`${String(value || '').length}/${maxLength}`}</p> : null}
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full text-left bg-[#0a0a0a] border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          {description ? <p className="text-xs text-gray-500 mt-0.5">{description}</p> : null}
        </div>
        <span
          className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-white' : 'bg-gray-700'}`}
        >
          <span
            className={`block h-5 w-5 rounded-full mt-0.5 transition-transform ${checked ? 'bg-black translate-x-5 ml-0.5' : 'bg-white translate-x-0.5'}`}
          />
        </span>
      </div>
    </button>
  );
}

export function ArrayRowActions({ onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-300 border border-red-900/70 hover:border-red-800 hover:text-red-200 rounded-md transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" /> Remove
    </button>
  );
}

export function AddRowButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-white border border-gray-700 rounded-lg hover:bg-[#181818] transition-colors"
    >
      <Plus className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
