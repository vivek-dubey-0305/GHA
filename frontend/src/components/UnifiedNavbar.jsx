import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/slices/auth.slice";
import { useNavigationHistory } from "../hooks/useNavigationHistory";
import "./UnifiedNavbar.css";

/**
 * UnifiedNavbar - Centralized navbar component for all pages
 * 
 * Props:
 *   - mode: 'courses' | 'instructors' | 'paths' | 'home'
 *   - searchQuery: Current search query
 *   - onSearch: Callback for search input
 *   - placeholder: Custom search placeholder
 *   - showSearch: Whether to show search bar
 */
export default function UnifiedNavbar({
  mode = "home",
  searchQuery,
  onSearch,
  onSearchSubmit,
  liveSearch = true,
  placeholder = "",
  showSearch = true,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [homeSearchScope, setHomeSearchScope] = useState("courses");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { goBack, canGoBack } = useNavigationHistory();

  const hasExternalSearchState = typeof searchQuery === "string";
  const activeSearchQuery = hasExternalSearchState ? searchQuery : internalSearchQuery;

  const emitSearch = (value, submitted = false) => {
    if (typeof onSearch === "function") onSearch(value);
    if (submitted && typeof onSearchSubmit === "function") onSearchSubmit(value);
  };

  const handleSearch = (value) => {
    if (hasExternalSearchState) {
      if (liveSearch) {
        emitSearch(value, false);
      } else if (typeof onSearch === "function") {
        onSearch(value);
      }
      return;
    }

    setInternalSearchQuery(value);
    if (liveSearch) emitSearch(value, false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = activeSearchQuery.trim();

    inputRef.current?.blur();

    if (mode !== "home") {
      emitSearch(query, true);
      return;
    }

    if (!query) return;

    const targetPath = homeSearchScope === "instructors" ? "/instructors" : "/courses";
    const encodedQuery = encodeURIComponent(query);
    navigate(`${targetPath}?search=${encodedQuery}`);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
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

  const homeCtaLabel = isAuthenticated ? "Dashboard →" : "Enter the Greed →";
  const homeCtaTo = isAuthenticated ? "/dashboard" : "/login";
  const courseCtaTo = isAuthenticated ? "/dashboard/courses" : "/login";

  return (
    <>
      <nav className={`unified-nav${scrolled ? " scrolled" : ""}`}>
        {/* Logo */}
        <Link to="/" className="un-logo">
          GH<span>A</span>
        </Link>

        {/* Search Bar */}
        {showSearch && (
          <form className="un-search-wrap" onSubmit={handleSubmit}>
            {mode === "home" && (
              <select
                className="un-search-scope"
                value={homeSearchScope}
                onChange={(e) => setHomeSearchScope(e.target.value)}
                aria-label="Search type"
              >
                <option value="courses">Courses</option>
                <option value="instructors">Instructors</option>
              </select>
            )}
            <span className="un-search-ico">⌕</span>
            <input
              ref={inputRef}
              type="text"
              className="un-search"
              placeholder={searchPlaceholder}
              value={activeSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {activeSearchQuery && (
              <button
                type="button"
                className="un-search-clear"
                onClick={() => {
                  if (hasExternalSearchState) {
                    if (typeof onSearch === "function") onSearch("");
                    if (!liveSearch && mode !== "home" && typeof onSearchSubmit === "function") {
                      onSearchSubmit("");
                    }
                  } else {
                    setInternalSearchQuery("");
                  }

                  if (!hasExternalSearchState) {
                    emitSearch("", false);
                  }
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
            {mode === "home" && (
              <button type="submit" className="un-search-submit" title="Search">
                Go
              </button>
            )}
          </form>
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
        {mode === "courses" ? (
          <Link to={courseCtaTo} className="un-cta-btn">
            My Courses →
          </Link>
        ) : mode === "instructors" ? (
          <button className="un-cta-btn">Hire for Mentorship →</button>
        ) : (
          <Link to={homeCtaTo} className="un-cta-btn">
            {homeCtaLabel}
          </Link>
        )}

        <button
          className={`un-mobile-toggle${isMenuOpen ? " open" : ""}`}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {isMenuOpen && <button className="un-mobile-overlay" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />}

      <aside className={`un-mobile-drawer${isMenuOpen ? " open" : ""}`}>
        <NavLink to="/courses" className="un-nav-link" onClick={() => setIsMenuOpen(false)}>
          Courses
        </NavLink>
        <NavLink to="/instructors" className="un-nav-link" onClick={() => setIsMenuOpen(false)}>
          Instructors
        </NavLink>
        <NavLink to="/paths" className="un-nav-link" onClick={() => setIsMenuOpen(false)}>
          Paths
        </NavLink>
        <a href="#community" className="un-nav-link" onClick={() => setIsMenuOpen(false)}>
          Community
        </a>
      </aside>
    </>
  );
}
