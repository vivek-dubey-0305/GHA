export default function CLToolbar({ resultCount, sortMode, onSort, viewMode, onView }) {
  return (
    <div className="cl-toolbar">
      <div className="cl-result-count">
        <em>{resultCount}</em> results found
      </div>
      <div className="cl-toolbar-right">
        <span className="cl-sort-label">Sort by</span>
        <select
          className="cl-sort-select"
          value={sortMode}
          onChange={(e) => onSort(e.target.value)}
        >
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="newest">Newest First</option>
          <option value="duration-asc">Shortest First</option>
          <option value="duration-desc">Longest First</option>
        </select>
        <div className="cl-view-btns">
          <button
            className={`cl-view-btn${viewMode === "grid" ? " active" : ""}`}
            title="Grid view"
            onClick={() => onView("grid")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="6" height="6" />
              <rect x="8" y="0" width="6" height="6" />
              <rect x="0" y="8" width="6" height="6" />
              <rect x="8" y="8" width="6" height="6" />
            </svg>
          </button>
          <button
            className={`cl-view-btn${viewMode === "list" ? " active" : ""}`}
            title="List view"
            onClick={() => onView("list")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="1" width="14" height="2" />
              <rect x="0" y="6" width="14" height="2" />
              <rect x="0" y="11" width="14" height="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
