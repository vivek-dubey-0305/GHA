import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function IDNavbar({ onContact }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`id-nav-detail${scrolled ? " scrolled" : ""}`}>
      <Link to="/" className="id-nav-detail-logo">GHA</Link>

      <button className="id-nav-detail-back" onClick={() => navigate("/instructors")}>
        ← Back to Instructors
      </button>

      <button className="id-nav-detail-contact-btn" onClick={onContact}>
        Contact Instructor
      </button>
    </nav>
  );
}
