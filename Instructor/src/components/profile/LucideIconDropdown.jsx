import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { LUCIDE_ICON_OPTIONS } from '../../constants/profile/lucideIcons.constant';
import { getLucideIconByName } from '../../utils/lucideIcon.utils';

function IconByName({ name, fallback = 'Circle', className = 'w-4 h-4' }) {
  return createElement(getLucideIconByName(name, fallback), { className });
}

export function LucideIconDropdown({
  label,
  value,
  onChange,
  fallback = 'Circle',
  searchPlaceholder = 'Search icon...'
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedValue = value || '';
  const selectedIconName = LUCIDE_ICON_OPTIONS.some((option) => option.value === selectedValue)
    ? selectedValue
    : fallback;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return LUCIDE_ICON_OPTIONS;

    return LUCIDE_ICON_OPTIONS.filter((option) =>
      option.value.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      {label ? <label className="block text-xs font-medium tracking-wide text-gray-500 mb-1.5">{label}</label> : null}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-left text-white focus:outline-none focus:border-gray-600 flex items-center justify-between gap-3"
      >
        <span className={`truncate ${selectedValue ? 'text-white' : 'text-gray-500'}`}>
          {selectedValue || 'Select Lucide icon'}
        </span>
        <span className="inline-flex items-center gap-2 text-gray-300">
          <IconByName name={selectedIconName} fallback={fallback} className="w-4 h-4" />
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full bg-[#0a0a0a] border border-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#111] border border-gray-800 rounded-md pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValue === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3 py-2 text-sm flex items-center justify-between gap-3 border-b border-gray-900 last:border-b-0 transition-colors ${
                      isSelected ? 'bg-[#161616] text-white' : 'text-gray-300 hover:bg-[#151515]'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    <IconByName name={option.value} fallback={fallback} className="w-4 h-4 shrink-0" />
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500">No icons matched your search.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
