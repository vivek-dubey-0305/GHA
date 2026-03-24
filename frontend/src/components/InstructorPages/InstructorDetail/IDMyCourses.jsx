import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InstructorEmptyState from "../InstructorEmptyState";

const BADGE_STYLES = {
  "badge-best":  "background:#f5c518;color:#0a0a0a",
  "badge-new":   "background:#111;color:#f5c518;border:1px solid #f5c518",
  "badge-hot":   "background:#e74c3c;color:#fff",
  "badge-intern":"background:#27ae60;color:#fff",
};

function Stars({ rating }) {
  const full = Math.floor(rating), half = rating % 1 >= 0.5;
  return <span className="id-mc-stars">{"★".repeat(full)}{half?"½":""}{"☆".repeat(5-Math.ceil(rating))}</span>;
}

export default function IDMyCourses({ instructor }) {
  const [sort, setSort] = useState("popular");
  const navigate = useNavigate();

  if (!instructor) return null;

  const courses = [...(instructor.myCourses || [])].sort((a, b) => {
    if (sort === "rating")    return b.rating - a.rating;
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "newest")    return b.id - a.id;
    return b.students - a.students;
  });

  return (
    <>
      <div className="id-courses-toolbar">
        <div className="id-courses-count-lbl">
          <em>{courses.length}</em> courses by {instructor.name.split(" ")[0]}
        </div>
        <select className="id-courses-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="id-my-courses-grid">
        {courses.length === 0 ? (
          <InstructorEmptyState
            title="No Published Courses"
            description="This instructor has not published any public courses yet."
            compact
          />
        ) : courses.map((c, i) => (
          <div
            key={c.id}
            className="id-mc-card"
            style={{ animationDelay: `${i * 0.06}s` }}
            onClick={() => navigate(`/courses/${c.id}`)}
          >
            <div className="id-mc-thumb">
              <img src={c.img} alt={c.title} loading="lazy"/>
              <div className="id-mc-thumb-ov"/>
              <span className="id-mc-level">{c.level}</span>
              {(c.badges || []).map((b) => (
                <span key={b.cls} className="id-mc-badge" style={{ ...Object.fromEntries((BADGE_STYLES[b.cls]||"").split(";").filter(Boolean).map(s=>s.split(":"))) }}>
                  {b.label}
                </span>
              ))}
            </div>
            <div className="id-mc-body">
              <div className="id-mc-cat">{c.cat} › {c.sub}</div>
              <div className="id-mc-title">{c.title}</div>
              <div className="id-mc-meta-row">
                <span className="id-mc-chip">⏱ {c.hours}h</span>
                <span className="id-mc-chip">{c.projects} projects</span>
                {c.internship && <span className="id-mc-chip yellow">🎓 Internship</span>}
              </div>
              <div className="id-mc-stars-row">
                <Stars rating={c.rating}/>
                <span className="id-mc-rating">{c.rating}</span>
                <span className="id-mc-rev">({c.reviews.toLocaleString()})</span>
              </div>
              <div className="id-mc-footer">
                <div>
                  <span className="id-mc-price">${c.price}</span>
                  {c.oldPrice && <span className="id-mc-old">${c.oldPrice}</span>}
                </div>
                <button className="id-mc-enroll" onClick={(e) => { e.stopPropagation(); navigate(`/courses/${c.id}`); }}>
                  Enroll →
                </button>
              </div>
            </div>
            <div className="id-mc-hover-bdr"/>
            <div className="id-mc-progress-flash"/>
          </div>
        ))}
      </div>
    </>
  );
}
