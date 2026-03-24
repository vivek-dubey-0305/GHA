import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  getAllCourses,
  setFilters,
  setSortBy,
  setSearch,
  clearFilters,
} from "../../redux/slices/course.slice.js";

export default function Course() {
  // ── Cursor & particles ──
  const { dotRef, ringRef } = useCPCursor();
  const canvasRef = useCPParticles();
  useCPReveal();

  // ── Redux state ──
  const dispatch = useDispatch();
  const {
    courses,
    pagination,
    filters,
    sortBy,
    loadingCourses,
    error,
  } = useSelector((state) => state.course);

  // ── Local UI state ──
  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [activeFilters, setActiveFilters] = useState({});

  // ── Initialize: Fetch courses on mount ──
  useEffect(() => {
    dispatch(getAllCourses({
      page: 1,
      limit: 12,
      ...filters,
      sort: sortBy,
    }));
  }, [dispatch]);

  // ── Handle filter toggle ──
  const toggleFilter = (type, val) => {
    setActiveFilters((prev) => {
      const existing = prev[type] || [];
      const next = existing.includes(val)
        ? existing.filter((v) => v !== val)
        : [...existing, val];
      const updated = { ...prev };
      if (next.length === 0) delete updated[type];
      else updated[type] = next;
      
      // Dispatch Redux action
      dispatch(setFilters(updated));
      return updated;
    });
  };

  const toggleFlag = (flag) => toggleFilter("flags", flag);

  const removeFilter = (type, valStr) => {
    if (type === "search") {
      dispatch(setSearch(""));
      setActiveFilters((prev) => {
        const updated = { ...prev };
        delete updated.search;
        return updated;
      });
      return;
    }
    const val = valStr.replace(/^"|"$/g, "");
    toggleFilter(type, val);
  };

  const handlePriceChange = (newRange) => {
    setPriceRange(newRange);
    dispatch(setFilters({
      ...filters,
      minPrice: newRange[0],
      maxPrice: newRange[1],
    }));
  };

  const handleSearch = (query) => {
    dispatch(setSearch(query));
    setActiveFilters((prev) => ({
      ...prev,
      search: query,
    }));
  };

  const handleSort = (newSort) => {
    dispatch(setSortBy(newSort));
  };

  const clearAll = () => {
    dispatch(clearFilters());
    setActiveFilters({});
    setPriceRange([0, 10000]);
  };

  // ── Fetch on filter/sort change ──
  useEffect(() => {
    const params = {
      page: 1,
      limit: 12,
      ...filters,
      sort: sortBy,
    };
    if (priceRange[0] > 0) params.minPrice = priceRange[0];
    if (priceRange[1] < 10000) params.maxPrice = priceRange[1];
    
    dispatch(getAllCourses(params));
  }, [filters, sortBy, priceRange, dispatch]);

  // ── Stats for header ──
  const totalStudents = courses.reduce(
    (sum, course) =>
      sum +
      Number(
        course?.enrolledCount ||
          course?.students ||
          course?.totalEnrollments ||
          course?.totalStudents ||
          0
      ),
    0
  );
  const totalCoursesCount =
    Number(pagination?.totalItems) ||
    Number(pagination?.totalResults) ||
    Number(pagination?.count) ||
    courses.length ||
    0;
  const totalCategories = new Set(
    courses
      .map((course) => {
        if (typeof course?.category === "string") return course.category;
        if (typeof course?.cat === "string") return course.cat;
        return course?.category?.title || null;
      })
      .filter(Boolean)
  ).size;
  const totalInternships = courses.reduce((sum, course) => {
    const internshipFromFlag = Boolean(course?.internship || course?.isInternshipEligible || course?.internshipEligible);
    const internshipFromBadges = Array.isArray(course?.badges)
      ? course.badges.some((badge) => {
          if (typeof badge === "string") return badge.toLowerCase().includes("intern");
          const cls = String(badge?.cls || "").toLowerCase();
          const label = String(badge?.label || "").toLowerCase();
          return cls.includes("intern") || label.includes("intern");
        })
      : false;

    return sum + (internshipFromFlag || internshipFromBadges ? 1 : 0);
  }, 0);

  if (loadingCourses && courses.length === 0) {
    return (
      <div className="cl-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#f4f3ee", fontSize: "1.5rem" }}>Loading courses...</div>
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="cl-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "#ff6b6b", fontSize: "1.2rem" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="cl-page">
      {/* Fixed overlays */}
      <div className="cp-cursor" ref={dotRef}  />
      <div className="cp-cursor-ring" ref={ringRef} />
      <div className="cp-noise" />
      <canvas className="cp-canvas" ref={canvasRef} />

      {/* NAVBAR */}
      <CLNavbar
        searchQuery={filters.search || ""}
        onSearch={handleSearch}
        resultCount={totalCoursesCount}
      />

      {/* PAGE HEADER */}
      <CLPageHeader
        totalCourses={totalCoursesCount}
        totalCategories={totalCategories}
        totalStudents={totalStudents}
        totalInternships={totalInternships}
      />

      {/* CHIPS BAR */}
      <CLChipsBar
        activeFilters={activeFilters}
        searchQuery={filters.search || ""}
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
          onPriceRange={handlePriceChange}
        />

        <main className="cl-main" id="cl-mainContent">
          <CLToolbar
            resultCount={totalCoursesCount}
            sortMode={sortBy}
            onSort={handleSort}
            viewMode={viewMode}
            onView={setViewMode}
          />

          {loadingCourses ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#f4f3ee" }}>
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#f4f3ee" }}>
              No courses found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <CLCourseGrid courses={courses} viewMode={viewMode} />

              <CLPagination
                currentPage={pagination.currentPage || 1}
                totalPages={pagination.totalPages || 1}
                onPage={(page) => {
                  dispatch(getAllCourses({
                    page,
                    limit: 12,
                    ...filters,
                    sort: sortBy,
                  }));
                }}
              />
            </>
          )}
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
