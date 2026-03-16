import { useEffect, useState } from "react";
import "../../components/CoursePages/course-pages.css";
import "../../components/CoursePages/CourseListing/course-listing.css";

import useCPCursor    from "../../components/CoursePages/useCPCursor";
import useCPParticles from "../../components/CoursePages/useCPParticles";
import useCPReveal    from "../../components/CoursePages/useCPReveal";

import CLNavbar     from "../../components/CoursePages/CourseListing/CLNavbar";
import CLPageHeader from "../../components/CoursePages/CourseListing/CLPageHeader";
import CLChipsBar   from "../../components/CoursePages/CourseListing/CLChipsBar";
import CLSidebar    from "../../components/CoursePages/CourseListing/CLSidebar";
import CLToolbar    from "../../components/CoursePages/CourseListing/CLToolbar";
import CLCourseGrid from "../../components/CoursePages/CourseListing/CLCourseGrid";
import CLPagination from "../../components/CoursePages/CourseListing/CLPagination";

import {
  mockCourses,
  filterCourses,
  sortCourses,
} from "../../mock/course";

const ITEMS_PER_PAGE = 9;

export default function Course() {
  // ── Cursor & particles ──
  const { dotRef, ringRef } = useCPCursor();
  const canvasRef = useCPParticles();
  useCPReveal();

  // ── Filter state ──
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [priceRange, setPriceRange]      = useState([0, 299]);
  const [sortMode, setSortMode]          = useState("popular");
  const [viewMode, setViewMode]          = useState("grid");
  const [currentPage, setCurrentPage]    = useState(1);

  // Recalculate on every filter/sort change
  const filtered = filterCourses(
    mockCourses,
    { ...activeFilters, priceRange },
    searchQuery
  );
  const sorted   = sortCourses(filtered, sortMode);
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeFilters, priceRange, sortMode]);

  // ── Filter helpers ──
  const toggleFilter = (type, val) => {
    setActiveFilters((prev) => {
      const existing = prev[type] || [];
      const next = existing.includes(val)
        ? existing.filter((v) => v !== val)
        : [...existing, val];
      const updated = { ...prev };
      if (next.length === 0) delete updated[type];
      else updated[type] = next;
      return updated;
    });
  };

  const toggleFlag = (flag) => toggleFilter("flags", flag);

  const removeFilter = (type, valStr) => {
    if (type === "search") { setSearchQuery(""); return; }
    const val = valStr.replace(/^"|"$/g, ""); // strip quotes from search chip
    toggleFilter(type, val);
  };

  const clearAll = () => {
    setActiveFilters({});
    setSearchQuery("");
    setPriceRange([0, 299]);
  };

  // ── Stats for header ──
  const totalStudents  = mockCourses.reduce((s, c) => s + (c.students || c.enrolledCount || 0), 0);

  return (
    <div className="cl-page">
      {/* Fixed overlays */}
      <div className="cp-cursor" ref={dotRef}  />
      <div className="cp-cursor-ring" ref={ringRef} />
      <div className="cp-noise" />
      <canvas className="cp-canvas" ref={canvasRef} />

      {/* NAVBAR */}
      <CLNavbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        resultCount={filtered.length}
      />

      {/* PAGE HEADER */}
      <CLPageHeader
        totalCourses={mockCourses.length}
        totalStudents={totalStudents}
        totalInstructors={4}
      />

      {/* CHIPS BAR */}
      <CLChipsBar
        activeFilters={activeFilters}
        searchQuery={searchQuery}
        onRemoveFilter={removeFilter}
        onClearAll={clearAll}
      />

      {/* SIDEBAR + MAIN LAYOUT */}
      <div className="cl-layout">
        <CLSidebar
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          onToggleFlag={toggleFlag}
          onClearAll={clearAll}
          priceRange={priceRange}
          onPriceRange={setPriceRange}
        />

        <main className="cl-main" id="cl-mainContent">
          <CLToolbar
            resultCount={filtered.length}
            sortMode={sortMode}
            onSort={setSortMode}
            viewMode={viewMode}
            onView={setViewMode}
          />

          <CLCourseGrid courses={paginated} viewMode={viewMode} />

          <CLPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPage={setCurrentPage}
          />
        </main>
      </div>

      {/* Mobile filter button */}
      <button
        className="cl-mob-filter-btn"
        onClick={() =>
          document.getElementById("cl-sidebar")?.classList.toggle("open")
        }
      >
        ⚙
      </button>
    </div>
  );
}
