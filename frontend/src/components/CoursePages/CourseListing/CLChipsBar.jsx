export default function CLChipsBar({ activeFilters, searchQuery, onRemoveFilter, onClearAll }) {
  const chips = [];

  Object.entries(activeFilters).forEach(([type, values]) => {
    if (type === "priceRange") return; // handled separately
    if (Array.isArray(values)) {
      values.forEach((val) => chips.push({ type, val }));
    }
  });

  if (searchQuery) chips.push({ type: "search", val: `"${searchQuery}"` });

  if (chips.length === 0) return null;

  return (
    <div className="cl-chips-bar">
      <span className="cl-chips-label">Active Filters:</span>
      {chips.map(({ type, val }) => (
        <span
          key={`${type}-${val}`}
          className="cl-chip"
          onClick={() => onRemoveFilter(type, val)}
        >
          {val} <span className="cl-chip-x">✕</span>
        </span>
      ))}
      <button className="cl-clear-all" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  );
}
