import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import InstructorEmptyState from "../../components/InstructorPages/InstructorEmptyState";
import {
  getAllInstructors,
  searchInstructors,
} from "../../redux/slices/instructor.slice.js";

const ITEMS_PER_PAGE = 9;

const SPECIALIZATION_CATEGORY_MAP = {
  "Web Dev": "web_development",
  "Machine Learning": "machine_learning",
  "Design": "design",
  "Data Science": "data_science",
  "DevOps": "devops",
  "Mobile": "mobile_app_development",
  "Cybersecurity": "cybersecurity",
  "Business": "business",
  "Blockchain": "blockchain",
};

const BACKGROUND_TYPE_MAP = {
  FAANG: "faang",
  Startup: "startup",
  Research: "research",
};

const RATING_THRESHOLD_MAP = {
  "4.8+": 4.8,
  "4.5+": 4.5,
  "4.0+": 4,
};

const STUDENTS_THRESHOLD_MAP = {
  "1K+": 1000,
  "5K+": 5000,
  "20K+": 20000,
  "50K+": 50000,
};

const REVIEWS_THRESHOLD_MAP = {
  "500+": 500,
  "2K+": 2000,
  "5K+": 5000,
};

const resolveProfileImage = (profilePicture) => {
  if (typeof profilePicture === "string") return profilePicture;
  return profilePicture?.secure_url || "https://ui-avatars.com/api/?name=Instructor&background=0a0a0a&color=f5c518";
};

const mapInstructorForCard = (instructor) => {
  const averageRating = Number(instructor?.rating?.averageRating || 0);
  const reviewCount = Number(instructor?.rating?.totalReviews || 0);
  const specializationAreas = (instructor?.specializations || []).map((s) => s?.area).filter(Boolean);

  const badges = [];
  if (instructor?.isTopInstructor) badges.push("top");
  if (instructor?.isDocumentsVerified) badges.push("verified");
  if (instructor?.availability?.isAvailableForMentorship || instructor?.availability?.isAvailableForLive) {
    badges.push("mentor");
  }

  return {
    id: instructor?._id,
    name: `${instructor?.firstName || ""} ${instructor?.lastName || ""}`.trim() || "Instructor",
    title: instructor?.professionalTitle || "Professional Instructor",
    specs: specializationAreas.slice(0, 3),
    bio: instructor?.shortBio || "Profile details will be updated soon.",
    rating: Number(averageRating.toFixed(2)),
    reviews: reviewCount,
    students: Number(instructor?.totalStudentsTeaching || 0),
    courses: Number(instructor?.totalCourses || 0),
    exp: Number(instructor?.yearsOfExperience || 0),
    liveClasses: Number(instructor?.totalLiveClasses || 0),
    img: resolveProfileImage(instructor?.profilePicture),
    bannerColor: instructor?.bannerColor || "#111111",
    badges,
  };
};

const getMinFromMappedValues = (values, mapping) => {
  if (!Array.isArray(values) || values.length === 0) return undefined;
  const nums = values
    .map((value) => mapping[value])
    .filter((value) => Number.isFinite(value));
  if (nums.length === 0) return undefined;
  return Math.min(...nums);
};

const buildQueryFromFilters = ({ currentPage, sortMode, searchQuery, activeFilters, expRange }) => {
  const params = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: sortMode,
  };

  if (searchQuery?.trim()) {
    params.search = searchQuery.trim();
  }

  if (Array.isArray(activeFilters.spec) && activeFilters.spec.length > 0) {
    const mapped = activeFilters.spec
      .map((spec) => SPECIALIZATION_CATEGORY_MAP[spec])
      .filter(Boolean);
    if (mapped.length > 0) params.specializationCategory = mapped;
  }

  const minRating = getMinFromMappedValues(activeFilters.rating, RATING_THRESHOLD_MAP);
  if (minRating !== undefined) params.rating = [minRating];

  const minStudents = getMinFromMappedValues(activeFilters.students, STUDENTS_THRESHOLD_MAP);
  if (minStudents !== undefined) params.studentsTaught = [minStudents];

  if (Array.isArray(activeFilters.courses) && activeFilters.courses.length > 0) {
    params.totalCourses = activeFilters.courses;
  }

  if (Array.isArray(expRange) && expRange.length === 2) {
    const [minExp, maxExp] = expRange;
    if (Number.isFinite(minExp) && minExp > 0) params.yearsOfExperienceMin = minExp;
    if (Number.isFinite(maxExp) && maxExp < 20) params.yearsOfExperienceMax = maxExp;
  }

  const minReviews = getMinFromMappedValues(activeFilters.reviews, REVIEWS_THRESHOLD_MAP);
  if (minReviews !== undefined) params.reviewsCount = [minReviews];

  if (Array.isArray(activeFilters.company) && activeFilters.company.length > 0) {
    const backgrounds = activeFilters.company
      .map((value) => BACKGROUND_TYPE_MAP[value])
      .filter(Boolean);
    if (backgrounds.length > 0) {
      params.backgroundType = backgrounds;
    }
    if (activeFilters.company.includes("Mentor")) {
      params.availableForMentorship = true;
    }
  }

  return params;
};

export default function Instructors() {
  const dispatch = useDispatch();
  const { dotRef, ringRef } = useIPCursor();
  const canvasRef = useIPParticles();
  useIPReveal();

  const {
    instructors,
    pagination,
    loadingInstructors,
    error,
  } = useSelector((state) => state.instructor);

  const [searchQuery,   setSearchQuery]   = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [expRange,      setExpRange]      = useState([0, 20]);
  const [sortMode,      setSortMode]      = useState("popular");
  const [viewMode,      setViewMode]      = useState("grid");
  const [currentPage,   setCurrentPage]   = useState(1);

  const mappedInstructors = (instructors || []).map(mapInstructorForCard);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeFilters, expRange, sortMode]);

  useEffect(() => {
    const params = buildQueryFromFilters({
      currentPage,
      sortMode,
      searchQuery,
      activeFilters,
      expRange,
    });

    if (searchQuery.trim()) {
      dispatch(searchInstructors({ query: searchQuery.trim(), ...params }));
      return;
    }

    dispatch(getAllInstructors(params));
  }, [dispatch, currentPage, sortMode, searchQuery, activeFilters, expRange]);

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

  const totalInstructors = pagination?.totalItems || mappedInstructors.length || 0;
  const totalCourses = mappedInstructors.reduce((sum, item) => sum + (item.courses || 0), 0);
  const totalStudents = mappedInstructors.reduce((sum, item) => sum + (item.students || 0), 0);
  const totalLiveSessions = mappedInstructors.reduce((sum, item) => sum + (item.liveClasses || 0), 0);

  return (
    <div className="il-page">
      {/* Fixed overlays */}
      <div className="ip-cursor"      ref={dotRef} />
      <div className="ip-cursor-ring" ref={ringRef} />
      <div className="ip-noise" />
      <canvas className="ip-canvas" ref={canvasRef} />

      {/* NAVBAR */}
      <ILNavbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        resultCount={totalInstructors}
      />

      {/* HERO */}
      <ILPageHeader
        totalInstructors={totalInstructors}
        totalLiveSessions={totalLiveSessions}
        totalCourses={totalCourses}
        totalStudents={totalStudents}
      />

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
            resultCount={totalInstructors}
            sortMode={sortMode}
            onSort={setSortMode}
            viewMode={viewMode}
            onView={setViewMode}
          />

          {loadingInstructors ? (
            <div style={{ padding: "1.2rem 0" }}>
              <InstructorEmptyState
                title="Loading Instructors"
                description="Fetching top mentors and experts for you..."
              />
            </div>
          ) : error ? (
            <div style={{ padding: "1.2rem 0" }}>
              <InstructorEmptyState
                title="Unable To Load Instructors"
                description={error}
                actionLabel="Retry"
                onAction={() => {
                  const params = buildQueryFromFilters({
                    currentPage,
                    sortMode,
                    searchQuery,
                    activeFilters,
                    expRange,
                  });
                  if (searchQuery.trim()) {
                    dispatch(searchInstructors({ query: searchQuery.trim(), ...params }));
                  } else {
                    dispatch(getAllInstructors(params));
                  }
                }}
              />
            </div>
          ) : (
            <>
              <ILInstructorGrid instructors={mappedInstructors} viewMode={viewMode} />

              <ILPagination
                currentPage={pagination?.currentPage || currentPage}
                totalPages={pagination?.totalPages || 1}
                onPage={setCurrentPage}
              />
            </>
          )}
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
