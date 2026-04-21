import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReviewEditorModal from "../../common/ReviewEditorModal.jsx";
import {
  createCourseReview,
  getCourseById,
  getCourseReviews,
  getMyCourseReview,
  markReviewHelpful,
  updateCourseReview,
} from "../../../redux/slices/course.slice.js";

function formatReviewDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function CDReviews({
  course,
  reviews = [],
  ratingStats,
  loadingReviews = false,
  openComposerToken,
}) {
  const dispatch = useDispatch();
  const [animated, setAnimated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(null);
  const [submissionError, setSubmissionError] = useState("");
  const [helpfulPendingById, setHelpfulPendingById] = useState({});
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { reviewActionLoading, reviewActionError, loadingMyReview } = useSelector((state) => state.course);
  const lastComposerTokenRef = useRef(null);

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

  const handleOpenReviewModal = useCallback(async () => {
    if (!course?._id) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/courses/${course._id}` } });
      return;
    }

    try {
      setSubmissionError("");
      const result = await dispatch(getMyCourseReview(course._id)).unwrap();
      setActiveReview(result?.review || null);
      setIsModalOpen(true);
    } catch (error) {
      setSubmissionError(error || "Could not prepare review form. Please try again.");
    }
  }, [course?._id, dispatch, isAuthenticated, navigate]);

  const handleSubmitReview = async ({ rating, comment }) => {
    if (!course?._id) return;

    try {
      setSubmissionError("");

      if (activeReview?._id) {
        await dispatch(updateCourseReview({
          reviewId: activeReview._id,
          rating,
          comment,
        })).unwrap();
      } else {
        await dispatch(createCourseReview({
          courseId: course._id,
          rating,
          comment,
        })).unwrap();
      }

      await Promise.all([
        dispatch(getCourseReviews({ courseId: course._id, page: 1, limit: 10 })),
        dispatch(getCourseById(course._id)),
      ]);

      setIsModalOpen(false);
    } catch (error) {
      setSubmissionError(error || "Unable to save your review right now.");
    }
  };

  useEffect(() => {
    if (!openComposerToken || !course?._id) return;
    if (lastComposerTokenRef.current === openComposerToken) return;
    lastComposerTokenRef.current = openComposerToken;
    handleOpenReviewModal();
  }, [openComposerToken, course?._id, handleOpenReviewModal]);

  const renderStars = (rating) => {
    const safe = Math.max(0, Math.min(5, Number(rating) || 0));
    const filled = Math.floor(safe);
    return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
  };

  const handleMarkHelpful = async (reviewId) => {
    const review = (reviews || []).find((item) => String(item?._id) === String(reviewId));
    if (!reviewId || helpfulPendingById[reviewId] || review?.isMarkedHelpfulByMe) return;

    try {
      setSubmissionError("");
      setHelpfulPendingById((prev) => ({ ...prev, [reviewId]: true }));
      await dispatch(markReviewHelpful(reviewId)).unwrap();
    } catch (error) {
      setSubmissionError(error || "Could not mark review as helpful.");
    } finally {
      setHelpfulPendingById((prev) => {
        const next = { ...prev };
        delete next[reviewId];
        return next;
      });
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
          <button
            className="cd-first-review-btn"
            onClick={handleOpenReviewModal}
            disabled={loadingMyReview}
            style={{ marginTop: "10px" }}
          >
            {loadingMyReview ? "Preparing review form..." : "Write / Edit Your Review"}
          </button>
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
                <div className="cd-review-stars">{renderStars(r.rating)}</div>
              </div>
              <div className="cd-review-text">{r.comment || r.title || ""}</div>
              <div className="cd-review-actions">
                <button
                  type="button"
                  className={`cd-helpful-btn${r.isMarkedHelpfulByMe ? " marked" : ""}`}
                  onClick={() => handleMarkHelpful(r._id)}
                  disabled={Boolean(helpfulPendingById[r._id] || r.isMarkedHelpfulByMe)}
                >
                  {helpfulPendingById[r._id]
                    ? "Marking..."
                    : r.isMarkedHelpfulByMe
                      ? "Marked Helpful"
                      : "Helpful"}
                </button>
                <span className="cd-helpful-count">{Number(r.helpful || 0)} found helpful</span>
              </div>
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
              onClick={handleOpenReviewModal}
              disabled={loadingMyReview}
            >
              {loadingMyReview ? "Preparing review form..." : "Be The First To Review"}
            </button>
          </div>
        )}
      </div>

      <ReviewEditorModal
        key={`${course?._id || "course"}-${activeReview?._id || "new"}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseTitle={course?.title}
        initialReview={activeReview}
        onSubmit={handleSubmitReview}
        isSubmitting={reviewActionLoading}
        submitError={submissionError || reviewActionError}
      />
    </>
  );
}
