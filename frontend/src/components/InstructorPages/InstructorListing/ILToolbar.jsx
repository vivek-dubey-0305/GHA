export default function ILToolbar({ resultCount, sortMode, onSort, viewMode, onView }) {
  return (
    <div className="il-toolbar">
      <div className="il-result-ct">
        <em>{resultCount}</em> instructors found
      </div>
      <div className="il-toolbar-r">
        <span className="il-sort-lbl">Sort by</span>
        <select className="il-sort-sel" value={sortMode} onChange={(e) => onSort(e.target.value)}>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="students">Most Students</option>
          <option value="courses">Most Courses</option>
          <option value="exp">Most Experienced</option>
          <option value="reviews">Most Reviews</option>
        </select>
        <div className="il-view-btns">
          <button className={`il-view-btn${viewMode === "grid" ? " active" : ""}`} title="Grid" onClick={() => onView("grid")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="6" height="6"/><rect x="8" y="0" width="6" height="6"/>
              <rect x="0" y="8" width="6" height="6"/><rect x="8" y="8" width="6" height="6"/>
            </svg>
          </button>
          <button className={`il-view-btn${viewMode === "list" ? " active" : ""}`} title="List" onClick={() => onView("list")}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="1" width="14" height="2"/>
              <rect x="0" y="6" width="14" height="2"/>
              <rect x="0" y="11" width="14" height="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
