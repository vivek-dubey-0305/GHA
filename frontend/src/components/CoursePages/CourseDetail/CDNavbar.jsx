import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function CDNavbar({ onEnroll }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`cd-nav${scrolled ? " scrolled" : ""}`}>
      <Link to="/" className="cd-nav-logo">GHA</Link>

      <button className="cd-nav-back" onClick={() => navigate("/courses")}>
        ← Back to Courses
      </button>

      <button className="cd-nav-enroll-btn" onClick={onEnroll}>
        Enroll Now
      </button>
    </nav>
  );
}
