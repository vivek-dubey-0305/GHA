import { useEffect, useState } from "react";
import "../../components/InstructorPages/instructor-pages.css";
import "../../components/InstructorPages/InstructorListing/instructor-listing.css";

import useIPCursor    from "../../components/InstructorPages/useIPCursor";
import useIPParticles from "../../components/InstructorPages/useIPParticles";
import useIPReveal    from "../../components/InstructorPages/useIPReveal";

import ILNavbar          from "../../components/InstructorPages/InstructorListing/ILNavbar";
import ILPageHeader      from "../../components/InstructorPages/InstructorListing/ILPageHeader";
import ILChipsBar        from "../../components/InstructorPages/InstructorListing/ILChipsBar";
import ILSidebar         from "../../components/InstructorPages/InstructorListing/ILSidebar";
import ILToolbar         from "../../components/InstructorPages/InstructorListing/ILToolbar";
import ILInstructorGrid  from "../../components/InstructorPages/InstructorListing/ILInstructorGrid";
import ILPagination      from "../../components/InstructorPages/InstructorListing/ILPagination";

import {
  mockInstructors,
  filterInstructors,
  sortInstructors,
} from "../../mock/instructor";

const ITEMS_PER_PAGE = 9;

export default function Instructors() {
  const { dotRef, ringRef } = useIPCursor();
  const canvasRef = useIPParticles();
  useIPReveal();

  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [expRange,      setExpRange]      = useState([0, 20]);
  const [sortMode,      setSortMode]      = useState("popular");
  const [viewMode,      setViewMode]      = useState("grid");
  const [currentPage,   setCurrentPage]   = useState(1);

  // Compute filtered + sorted + paginated
  const filtered  = filterInstructors(mockInstructors, { ...activeFilters, expRange }, searchQuery);
  const sorted    = sortInstructors(filtered, sortMode);
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated  = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeFilters, expRange, sortMode]);

  // Toggle filter (checkbox + star rows)
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

  // Toggle topic / specialization pill
  const toggleTopic = (topic) => {
    setActiveFilters((prev) => {
      const existing = prev.spec || [];
      const next = existing.includes(topic)
        ? existing.filter((t) => t !== topic)
        : [...existing, topic];
      const updated = { ...prev };
      if (next.length === 0) delete updated.spec;
      else updated.spec = next;
      return updated;
    });
  };

  const removeFilter = (type, valStr) => {
    if (type === "search") { setSearchQuery(""); return; }
    const val = valStr.replace(/^"|"$/g, "");
    toggleFilter(type, val);
  };

  const clearAll = () => {
    setActiveFilters({});
    setSearchQuery("");
    setExpRange([0, 20]);
  };

  return (
    <div className="il-page">
      {/* Fixed overlays */}
      <div className="ip-cursor"      ref={dotRef} />
      <div className="ip-cursor-ring" ref={ringRef} />
      <div className="ip-noise" />
      <canvas className="ip-canvas" ref={canvasRef} />

      {/* NAVBAR */}
      <ILNavbar />

      {/* HERO */}
      <ILPageHeader />

      {/* CHIPS */}
      <ILChipsBar
        activeFilters={activeFilters}
        searchQuery={searchQuery}
        onRemoveFilter={removeFilter}
        onClearAll={clearAll}
      />

      {/* LAYOUT: SIDEBAR + MAIN */}
      <div className="il-layout">
        <ILSidebar
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onToggleFilter={toggleFilter}
          onToggleTopic={toggleTopic}
          onClearAll={clearAll}
          expRange={expRange}
          onExpRange={setExpRange}
        />

        <main className="il-main">
          <ILToolbar
            resultCount={filtered.length}
            sortMode={sortMode}
            onSort={setSortMode}
            viewMode={viewMode}
            onView={setViewMode}
          />

          <ILInstructorGrid instructors={paginated} viewMode={viewMode} />

          <ILPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPage={setCurrentPage}
          />
        </main>
      </div>

      {/* Mobile filter button */}
      <button
        className="il-mob-filter-btn"
        onClick={() => document.getElementById("il-sidebar")?.classList.toggle("open")}
      >
        ⚙
      </button>

      {/* Footer */}
      <footer className="il-footer-bar">
        <a href="/" className="il-footer-logo">GHA</a>
        <span className="il-footer-copy">© 2025 GHA · All rights reserved</span>
      </footer>
    </div>
  );
}
