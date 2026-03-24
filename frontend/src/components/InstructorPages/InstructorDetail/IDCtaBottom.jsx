import { Link } from "react-router-dom";

export default function IDCtaBottom({ instructor }) {
  if (!instructor) return null;
  const firstName = String(instructor.name || "Instructor").split(" ")[0];

  return (
    <div className="id-cta-bottom">
      <svg className="id-cta-b-bg" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
        <text x="600" y="180" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="200" fill="#000" letterSpacing="10">LEARN</text>
      </svg>
      <div className="id-cta-b-inner">
        <div>
          <div className="id-cta-b-title">
            START LEARNING<br/>FROM {firstName.toUpperCase()}
          </div>
          <div className="id-cta-b-sub">
            {Number(instructor.courses || 0)} courses. {Number(instructor.students || 0).toLocaleString()} engineers taught. Real production code. Zero fluff.
          </div>
        </div>
        <div className="id-cta-b-actions">
          <Link to="/courses" className="id-cta-b-btn">Browse All Courses →</Link>
          <span className="id-cta-b-note">30-day money-back guarantee</span>
        </div>
      </div>
    </div>
  );
}
