export default function ILChipsBar({ activeFilters, searchQuery, onRemoveFilter, onClearAll }) {
  const chips = [];

  Object.entries(activeFilters).forEach(([type, vals]) => {
    if (type === "expRange") return;
    if (Array.isArray(vals)) {
      vals.forEach((v) => chips.push({ type, val: v }));
    }
  });
  if (searchQuery) chips.push({ type: "search", val: `"${searchQuery}"` });

  if (chips.length === 0) return null;

  return (
    <div className="il-chips-bar">
      <span className="il-chips-label">Active Filters:</span>
      {chips.map(({ type, val }) => (
        <span key={`${type}-${val}`} className="il-chip" onClick={() => onRemoveFilter(type, val)}>
          {val} <span className="il-chip-x">✕</span>
        </span>
      ))}
      <button className="il-clear-all" onClick={onClearAll}>✕ Clear All</button>
    </div>
  );
}
