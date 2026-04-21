import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../utils/api.utils.js";
import "./course-rating-hover.css";

function Stars({ rating, size = "sm" }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - Math.ceil(rating);

  return (
    <span className={`crh-stars ${size}`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}

function normalizeDistribution(stats) {
  const raw =
    stats?.ratingDistribution ||
    stats?.distribution ||
    stats?.starCounts ||
    stats?.ratings ||
    stats?.breakdown ||
    null;

  const initial = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!raw) return initial;

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      const star = Number(item?.star ?? item?.rating ?? item?.value ?? item?._id ?? 0);
      const count = Number(item?.count ?? item?.total ?? item?.reviews ?? 0);
      if (star >= 1 && star <= 5) initial[star] = count;
    });
    return initial;
  }

  [1, 2, 3, 4, 5].forEach((star) => {
    initial[star] = Number(
      raw?.[star] ??
      raw?.[String(star)] ??
      raw?.[`star${star}`] ??
      raw?.[`${star}Star`] ??
      raw?.[`${star}_star`] ??
      0
    );
  });

  return initial;
}

export default function CourseRatingHover({
  courseId,
  rating = 0,
  totalReviews = 0,
  size = "sm",
  className = "",
  ctaText = "See customer reviews",
}) {
  const navigate = useNavigate();
  const triggerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [canHover, setCanHover] = useState(true);
  const [popoverAlign, setPopoverAlign] = useState("left");
  const [popoverWidth, setPopoverWidth] = useState(320);

  const clearCloseTimer = () => {
    if (!hoverCloseTimerRef.current) return;
    window.clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = null;
  };

  const scheduleClose = () => {
    clearCloseTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 140);
  };

  const fetchStats = async () => {
    if (!courseId || loaded || loading) return;

    try {
      setError("");
      setLoading(true);
      const response = await apiClient.get(`/courses/${courseId}/reviews?page=1&limit=20`);
      const payload = response.data?.data || {};

      setStats(payload.ratingStats || null);
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
      setLoaded(true);
    } catch (requestError) {
      setLoaded(false);
      setError(requestError?.response?.data?.message || "Could not load rating details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = () => {
    if (!canHover) return;
    clearCloseTimer();

    const rect = triggerRef.current?.getBoundingClientRect();
    const viewportWidth = window.innerWidth || 360;
    const nextWidth = Math.min(340, Math.max(260, viewportWidth - 24));

    setPopoverWidth(nextWidth);
    if (rect && rect.left + nextWidth > viewportWidth - 12) {
      setPopoverAlign("right");
    } else {
      setPopoverAlign("left");
    }

    setOpen(true);
    fetchStats();
  };

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const applyCapability = () => setCanHover(Boolean(query.matches));
    applyCapability();

    query.addEventListener("change", applyCapability);
    return () => {
      query.removeEventListener("change", applyCapability);
      clearCloseTimer();
    };
  }, []);

  const resolvedAverage = Number(stats?.averageRating ?? rating ?? 0);
  const resolvedTotal = Number(stats?.totalReviews ?? totalReviews ?? 0);

  const sampleDistribution = useMemo(() => {
    const initial = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of reviews) {
      const star = Number(review?.rating || 0);
      if (star >= 1 && star <= 5) initial[star] += 1;
    }
    return initial;
  }, [reviews]);

  const normalizedDistribution = useMemo(() => normalizeDistribution(stats), [stats]);
  const hasServerDistribution = Object.values(normalizedDistribution).some((count) => Number(count) > 0);
  const distribution = hasServerDistribution ? normalizedDistribution : sampleDistribution;
  const distributionTotal = hasServerDistribution
    ? Math.max(resolvedTotal, 0)
    : Object.values(sampleDistribution).reduce((sum, value) => sum + Number(value || 0), 0);

  const goToReviews = (event) => {
    event?.stopPropagation?.();
    if (!courseId) return;
    const query = new URLSearchParams({ tab: "reviews" });
    navigate(`/courses/${courseId}?${query.toString()}`);
  };

  return (
    <div
      ref={triggerRef}
      className={`crh-trigger ${className}`.trim()}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
      onClick={goToReviews}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToReviews(event);
        }
      }}
    >
      <Stars rating={resolvedAverage} size={size} />
      <span className={`crh-rating-num ${size}`}>{resolvedAverage.toFixed(1)}</span>
      <span className={`crh-review-ct ${size}`}>({resolvedTotal.toLocaleString()} reviews)</span>

      {open && (
        <div
          className={`crh-popover ${popoverAlign === "right" ? "align-right" : "align-left"}`}
          style={{ width: `${popoverWidth}px` }}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
          onClick={(event) => event.stopPropagation()}
        >
          {loading && (
            <div className="crh-popover-loader-wrap">
              <div className="crh-popover-loader" />
            </div>
          )}

          {!loading && loaded && (
            <>
              <div className="crh-popover-head">
                <div className="crh-popover-stars">
                  <Stars rating={resolvedAverage} size="md" />
                </div>
                <div className="crh-popover-avg">{resolvedAverage.toFixed(1)} out of 5</div>
                <div className="crh-popover-total">{resolvedTotal.toLocaleString()} global ratings</div>
              </div>

              <div className="crh-popover-bars">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(distribution?.[star] || 0);
                  const pct = distributionTotal > 0 ? Math.round((count / distributionTotal) * 100) : 0;

                  return (
                    <div key={star} className="crh-popover-bar-row">
                      <span className="crh-popover-star-label">{star} star</span>
                      <div className="crh-popover-track">
                        <div className="crh-popover-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="crh-popover-pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <button type="button" className="crh-popover-cta" onClick={goToReviews}>
                {ctaText}
              </button>
            </>
          )}

          {!loading && !loaded && error && (
            <div className="crh-popover-error-wrap">
              <div className="crh-popover-footnote error">{error}</div>
              <button type="button" className="crh-popover-cta" onClick={fetchStats}>
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
