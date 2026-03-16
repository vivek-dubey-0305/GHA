import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BADGE_MAP = {
  best: { cls: "badge-best", label: "Bestseller" },
  new: { cls: "badge-new", label: "New" },
  hot: { cls: "badge-hot", label: "Hot" },
  intern: { cls: "badge-intern", label: "Internship" },
  free: { cls: "badge-free", label: "Free" },
};

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - Math.ceil(rating);
  return (
    <span className="cl-stars">
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

export default function CLCourseCard({ course, viewMode, index }) {
  const [wished, setWished] = useState(false);
  const navigate = useNavigate();

  const isList = viewMode === "list";

  const priceSection =
    course.price === 0 ? (
      <span className="cl-free-label">FREE</span>
    ) : (
      <>
        <span className="cl-price">${course.discountPrice || course.price}</span>
        {course.price && course.discountPrice && (
          <span className="cl-price-old">${course.price}</span>
        )}
      </>
    );

  return (
    <div
      className={`cl-card${isList ? " list-card" : ""}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => navigate(`/courses/${course._id}`)}
    >
      {/* THUMBNAIL */}
      <div className="cl-thumb">
        <img src={course.img || course.thumbnail?.secure_url} alt={course.title} loading="lazy" />
        <div className="cl-thumb-overlay" />

        {/* BADGES */}
        <div className="cl-badges">
          {(course.badges || []).map((b) => (
            <span key={b} className={`cl-badge ${BADGE_MAP[b]?.cls}`}>
              {BADGE_MAP[b]?.label}
            </span>
          ))}
        </div>

        {/* PLAY */}
        <div className="cl-play">
          <div className="cl-play-ico">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 2L12 7L4 12V2Z" fill="#f5c518" />
            </svg>
          </div>
        </div>

        {/* WISHLIST */}
        <div
          className={`cl-wish${wished ? " active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setWished((w) => !w);
          }}
        >
          {wished ? "♥" : "♡"}
        </div>

        <div className="cl-rating-bar" />
      </div>

      {/* BODY */}
      <div className="cl-card-body">
        <div className="cl-cat">
          {course.cat || course.category}
          <span className="cl-cat-sep">›</span>
          {course.sub || course.level}
        </div>
        <div className="cl-card-title">{course.title}</div>
        <div className="cl-card-desc">
          {course.desc || course.shortDescription}
        </div>

        {/* Instructor */}
        <div className="cl-instructor">
          <div className="cl-inst-avatar">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <rect width="20" height="20" fill="#1a1a1a" />
              <circle cx="10" cy="8" r="4" fill={course.instColor || "#f5c518"} opacity="0.7" />
              <ellipse cx="10" cy="20" rx="7" ry="5" fill={course.instColor || "#f5c518"} opacity="0.4" />
            </svg>
          </div>
          <span className="cl-inst-name">
            {typeof course.instructor === "string" ? course.instructor : "Instructor"}
          </span>
        </div>

        {/* Meta chips */}
        <div className="cl-meta-row">
          <span className="cl-meta-chip">
            {course.level || "All Levels"}
          </span>
          <span className="cl-meta-chip">
            ⏱ {course.hours || course.durationHours}h
          </span>
          <span className="cl-meta-chip">
            {course.projects || 0} projects
          </span>
          {course.internship && (
            <span className="cl-meta-chip yellow">🎓 Internship</span>
          )}
        </div>

        {/* Stars */}
        <div className="cl-stars-row">
          <Stars rating={course.rating} />
          <span className="cl-rating-num">{course.rating}</span>
          <span className="cl-review-ct">
            ({(course.reviews || course.totalReviews || 0).toLocaleString()} reviews)
          </span>
        </div>

        {/* Footer */}
        <div className="cl-card-footer">
          <div>{priceSection}</div>
          <button
            className="cl-enroll-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/courses/${course._id}`);
            }}
          >
            Enroll →
          </button>
        </div>
      </div>

      <div className="cl-hover-border" />
    </div>
  );
}
