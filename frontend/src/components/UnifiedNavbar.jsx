import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useNavigationHistory } from "../hooks/useNavigationHistory";
import "./UnifiedNavbar.css";

/**
 * UnifiedNavbar - Centralized navbar component for all pages
 * 
 * Props:
 *   - mode: 'courses' | 'instructors' | 'paths' | 'home'
 *   - searchQuery: Current search query
 *   - onSearch: Callback for search input
 *   - resultCount: Number of results (for courses/instructors)
 *   - placeholder: Custom search placeholder
 *   - showSearch: Whether to show search bar
 */
export default function UnifiedNavbar({
  mode = "home",
  searchQuery = "",
  onSearch = () => {},
  resultCount = 0,
  placeholder = "",
  showSearch = true,
}) {
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const { goBack, canGoBack } = useNavigationHistory();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine search placeholder based on mode
  const searchPlaceholder =
    placeholder ||
    {
      courses: "Search courses, topics, instructors…",
      instructors: "Search instructors, specializations…",
      paths: "Search learning paths…",
      home: "Search...",
    }[mode] ||
    "Search...";

  // Determine active link
  const isActiveLink = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={`unified-nav${scrolled ? " scrolled" : ""}`}>
      {/* Logo */}
      <Link to="/" className="un-logo">
        GH<span>A</span>
      </Link>

      {/* Search Bar */}
      {showSearch && (
        <div className="un-search-wrap">
          <span className="un-search-ico">⌕</span>
          <input
            ref={inputRef}
            type="text"
            className="un-search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
          {searchQuery && (
            <button
              className="un-search-clear"
              onClick={() => onSearch("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="un-nav-links">
        <NavLink to="/courses" className="un-nav-link">
          Courses
        </NavLink>
        <NavLink to="/instructors" className="un-nav-link">
          Instructors
        </NavLink>
        <NavLink to="/paths" className="un-nav-link">
          Paths
        </NavLink>
        <a href="#community" className="un-nav-link">
          Community
        </a>
      </div>

      {/* Result Count (for courses/instructors) */}
      {(mode === "courses" || mode === "instructors") && resultCount > 0 && (
        <span className="un-result-count">
          <em>{resultCount}</em> {mode === "courses" ? "COURSES" : "INSTRUCTORS"}
        </span>
      )}

      {/* Back Button */}
      {canGoBack && (
        <button
          className="un-back-btn"
          onClick={goBack}
          title="Go to previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 7H3M3 7L7 3M3 7L7 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      )}

      {/* CTA Button */}
      {mode === "courses" || mode === "instructors" ? (
        <button className="un-cta-btn">
          {mode === "courses" ? "Enroll Now" : "Hire for Mentorship →"}
        </button>
      ) : (
        <Link to="/courses" className="un-cta-btn">
          Start Learning
        </Link>
      )}
    </nav>
  );
}
