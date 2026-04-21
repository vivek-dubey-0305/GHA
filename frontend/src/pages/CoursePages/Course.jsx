import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import "../../components/CoursePages/course-pages.css";
import "../../components/CoursePages/CourseListing/course-listing.css";

import useCPCursor from "../../components/CoursePages/useCPCursor";
import useCPParticles from "../../components/CoursePages/useCPParticles";
import useCPReveal from "../../components/CoursePages/useCPReveal";

import CLNavbar from "../../components/CoursePages/CourseListing/CLNavbar";
import CLPageHeader from "../../components/CoursePages/CourseListing/CLPageHeader";
import CLChipsBar from "../../components/CoursePages/CourseListing/CLChipsBar";
import CLSidebar from "../../components/CoursePages/CourseListing/CLSidebar";
import CLToolbar from "../../components/CoursePages/CourseListing/CLToolbar";
import CLCourseGrid from "../../components/CoursePages/CourseListing/CLCourseGrid";
import CLPagination from "../../components/CoursePages/CourseListing/CLPagination";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";

import {
  getAllCourses,
  searchCourses,
  setFilters,
  setSortBy,
  setSearch,
  clearFilters,
} from "../../redux/slices/course.slice.js";

export default function Course() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = (searchParams.get("search") || "").trim();

  const { dotRef, ringRef } = useCPCursor();
  const canvasRef = useCPParticles();
  useCPReveal();

  const dispatch = useDispatch();
  const { courses, pagination, filters, sortBy, loadingCourses, error } = useSelector((state) => state.course);

  const [viewMode, setViewMode] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [activeFilters, setActiveFilters] = useState({});
  const [navSearchInput, setNavSearchInput] = useState(urlSearch);
  const isSearchHydrated = (filters.search || "") === urlSearch;

  const syncUrlSearch = (value) => {
    const current = (searchParams.get("search") || "").trim();
    const desired = (value || "").trim();
    if (current === desired) return;

    const next = new URLSearchParams(searchParams);
    if (desired) next.set("search", desired);
    else next.delete("search");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    dispatch(setSearch(urlSearch));
  }, [dispatch, urlSearch]);

  const scrollToListing = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("cl-mainContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleFilter = (type, val) => {
    setActiveFilters((prev) => {
      const existing = prev[type] || [];
      const next = existing.includes(val) ? existing.filter((v) => v !== val) : [...existing, val];
      const updated = { ...prev };
      if (next.length === 0) delete updated[type];
      else updated[type] = next;

      dispatch(setFilters(updated));
      return updated;
    });
  };

  const toggleFlag = (flag) => toggleFilter("flags", flag);

  const removeFilter = (type, valStr) => {
    if (type === "search") {
      dispatch(setSearch(""));
      setNavSearchInput("");
      setActiveFilters((prev) => {
        const updated = { ...prev };
        delete updated.search;
        return updated;
      });
      syncUrlSearch("");
      return;
    }
    const val = valStr.replace(/^"|"$/g, "");
    toggleFilter(type, val);
  };

  const handlePriceChange = (newRange) => {
    setPriceRange(newRange);
    dispatch(
      setFilters({
        ...filters,
        minPrice: newRange[0],
        maxPrice: newRange[1],
      })
    );
  };

  const handleSearch = (query) => {
    setNavSearchInput(query);
  };

  const handleSearchSubmit = (query) => {
    const normalized = String(query || "").trim();
    const committed = normalized.length >= 2 ? normalized : "";

    setNavSearchInput(normalized);
    dispatch(setSearch(committed));
    syncUrlSearch(committed);
    scrollToListing();
  };

  const handleSort = (newSort) => {
    dispatch(setSortBy(newSort));
  };

  const clearAll = () => {
    dispatch(clearFilters());
    setNavSearchInput("");
    setActiveFilters({});
    setPriceRange([0, 10000]);
    syncUrlSearch("");
  };

  useEffect(() => {
    if (!isSearchHydrated) return;

    const { search, ...restFilters } = filters;
    const params = {
      page: 1,
      limit: 12,
      ...restFilters,
      sort: sortBy,
    };

    if (priceRange[0] > 0) params.minPrice = priceRange[0];
    if (priceRange[1] < 10000) params.maxPrice = priceRange[1];

    const normalizedSearch = (search || "").trim();
    if (normalizedSearch.length >= 2) {
      dispatch(searchCourses({ query: normalizedSearch, ...params }));
      return;
    }

    dispatch(getAllCourses(params));
  }, [filters, sortBy, priceRange, dispatch, isSearchHydrated]);

  const totalStudents = courses.reduce(
    (sum, course) =>
      sum +
      Number(course?.enrolledCount || course?.students || course?.totalEnrollments || course?.totalStudents || 0),
    0
  );

  const totalCoursesCount =
    Number(pagination?.totalItems) || Number(pagination?.totalResults) || Number(pagination?.count) || courses.length || 0;

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

  return (
    <div className="cl-page">
      <div className="cp-cursor" ref={dotRef} />
      <div className="cp-cursor-ring" ref={ringRef} />
      <div className="cp-noise" />
      <canvas className="cp-canvas" ref={canvasRef} />

      <CLNavbar
        searchQuery={navSearchInput}
        onSearch={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        resultCount={totalCoursesCount}
      />

      <CLPageHeader
        totalCourses={totalCoursesCount}
        totalCategories={totalCategories}
        totalStudents={totalStudents}
        totalInternships={totalInternships}
      />

      <CLChipsBar
        activeFilters={activeFilters}
        searchQuery={filters.search || ""}
        onRemoveFilter={removeFilter}
        onClearAll={clearAll}
      />

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
            <SearchPulseLoader
              label="Searching courses"
              sublabel="Curating the best course matches"
              className="my-4"
            />
          ) : error ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#ff6b6b" }}>
              Error: {error}
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
                  const { search, ...restFilters } = filters;
                  const params = {
                    page,
                    limit: 12,
                    ...restFilters,
                    sort: sortBy,
                  };

                  const normalizedSearch = (search || "").trim();
                  if (normalizedSearch.length >= 2) {
                    dispatch(searchCourses({ query: normalizedSearch, ...params }));
                    return;
                  }

                  dispatch(getAllCourses(params));
                }}
              />
            </>
          )}
        </main>
      </div>

      <button className="cl-mob-filter-btn" onClick={() => document.getElementById("cl-sidebar")?.classList.toggle("open")}>
        ⚙
      </button>
    </div>
  );
}
