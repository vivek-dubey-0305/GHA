import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/slices/auth.slice";

export default function GlobalNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`global-nav${scrolled ? " global-nav-scrolled" : ""}`}>
        <Link to="/" className="global-nav-logo">GH<span>A</span></Link>
        <div className="global-nav-links">
          <NavLink to="/courses">Courses</NavLink>
          <NavLink to="/instructors">Instructors</NavLink>
          <NavLink to="/paths">Paths</NavLink>
          <a href="#community">Community</a>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate("/dashboard")}
              className="global-nav-cta"
            >
              Dashboard
            </button>
          ) : (
            <div className="global-nav-auth-group">
              {/* <button 
                onClick={() => navigate("/login")}
                className="global-nav-link-btn"
              >
                Login
              </button> */}
              <button 
                onClick={() => navigate("/register")}
                className="global-nav-cta"
              >
                Start Learning
              </button>
            </div>
          )}
        </div>
        {/* Mobile hamburger placeholder */}
        <button className="global-nav-hamburger" aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      <style>{`
        .global-nav {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 60px;
          z-index: 100;
          background: linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%);
          backdrop-filter: blur(2px);
          transition: background 0.3s, padding 0.3s;
        }
        .global-nav-scrolled {
          background: rgba(10,10,10,0.97);
          backdrop-filter: blur(14px);
          padding: 14px 60px;
          border-bottom: 1px solid rgba(245,197,24,0.12);
        }
        .global-nav-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem; letter-spacing: 4px;
          color: #f5f5f0; text-decoration: none;
          position: relative;
        }
        .global-nav-logo span { color: #f5c518; }
        .global-nav-logo::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 2px; background: #f5c518;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s;
        }
        .global-nav-logo:hover::after { transform: scaleX(1); }
        .global-nav-links {
          display: flex; gap: 36px; align-items: center;
        }
        .global-nav-links a,
        .global-nav-link-btn {
          font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase;
          color: #888; text-decoration: none; transition: color 0.3s; font-weight: 500;
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: inherit;
        }
        .global-nav-links a:hover,
        .global-nav-links a.active,
        .global-nav-link-btn:hover { color: #f5f5f0; }
        .global-nav-auth-group {
          display: flex; gap: 16px; align-items: center;
        }
        .global-nav-cta {
          background: #f5c518 !important; color: #0a0a0a !important;
          padding: 10px 24px; font-weight: 700 !important;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition: background 0.3s !important;
          border: none; cursor: pointer; font-size: 0.78rem; 
          letter-spacing: 2px; text-transform: uppercase;
        }
        .global-nav-cta:hover { background: #fff !important; color: #0a0a0a !important; }
        .global-nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .global-nav-hamburger span {
          display: block; width: 22px; height: 1.5px; background: #f5f5f0;
          transition: transform 0.3s;
        }
        @media (max-width: 768px) {
          .global-nav { padding: 16px 24px; }
          .global-nav-scrolled { padding: 12px 24px; }
          .global-nav-links { display: none; }
          .global-nav-hamburger { display: flex; }
        }
      `}</style>
    </>
  );
}
