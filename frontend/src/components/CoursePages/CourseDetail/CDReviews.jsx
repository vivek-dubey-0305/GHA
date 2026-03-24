import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiClient } from "../../../utils/api.utils.js";

function formatReviewDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function CDReviews({ course, reviews = [], ratingStats, loadingReviews = false }) {
  const [animated, setAnimated] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 100);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  if (!course) return null;

  const hasReviews = (reviews?.length || 0) > 0;
  const totalRatings = Number(ratingStats?.totalReviews || course.totalReviews || 0);
  const averageRating = totalRatings > 0
    ? Number(ratingStats?.averageRating ?? course.rating ?? 0)
    : 0;
  const distribution = ratingStats?.ratingDistribution || {};

  const ratingBars = [5, 4, 3, 2, 1].map((star) => {
    const count = Number(distribution?.[star] || 0);
    const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
    return { label: `${star} ★`, pct };
  });

  const handleFirstReview = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/courses/${course._id}` } });
      return;
    }

    try {
      setCheckingEligibility(true);
      await apiClient.get(`/user/enrollments/${course._id}`);
      console.log("User is enrolled and can review this course. Open review flow here.");
    } catch (error) {
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        console.log("Please re-enroll in this course before submitting a review.");
      } else {
        console.log("Could not verify enrollment. Please try again.");
      }
    } finally {
      setCheckingEligibility(false);
    }
  };

  return (
    <>
      {/* Summary */}
      <div className="cd-review-summary cp-reveal" ref={sectionRef}>
        <div>
          <div className="cd-review-big-num">{averageRating.toFixed(1)}</div>
          <div className="cd-review-stars-lg">★★★★★</div>
          <div className="cd-review-count">
            {totalRatings.toLocaleString()} ratings
          </div>
        </div>
        <div className="cd-rating-bars">
          {ratingBars.map((bar) => (
            <div key={bar.label} className="cd-rating-bar-row">
              <div className="cd-rating-bar-label">{bar.label}</div>
              <div className="cd-rating-bar-track">
                <div
                  className={`cd-rating-bar-fill${animated ? " animated" : ""}`}
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
              <div className="cd-rating-pct">{bar.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="cd-reviews-grid cp-reveal">
        {loadingReviews ? (
          <div className="cd-review-item">
            <div className="cd-review-text">Loading reviews...</div>
          </div>
        ) : hasReviews ? (
          reviews.map((r, i) => (
            <div key={r._id || i} className="cd-review-item">
              <div className="cd-review-header">
                <div>
                  <div className="cd-reviewer-name">
                    {(r.user?.firstName || "User").toUpperCase()} {(r.user?.lastName || "").toUpperCase()}
                  </div>
                  <div className="cd-review-date">{formatReviewDate(r.createdAt)}</div>
                </div>
                <div className="cd-review-stars">{"★".repeat(Number(r.rating || 0))}</div>
              </div>
              <div className="cd-review-text">{r.comment || r.title || ""}</div>
            </div>
          ))
        ) : (
          <div className="cd-review-item">
            <div className="cd-review-header">
              <div>
                <div className="cd-reviewer-name">NO REVIEWS YET</div>
                <div className="cd-review-date">Be the first learner to share feedback.</div>
              </div>
            </div>
            <button
              className="cd-first-review-btn"
              onClick={handleFirstReview}
              disabled={checkingEligibility}
            >
              {checkingEligibility ? "Checking eligibility..." : "Be The First To Review"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
