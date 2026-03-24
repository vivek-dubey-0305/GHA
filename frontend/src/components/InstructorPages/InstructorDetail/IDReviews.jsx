import { useEffect, useRef, useState } from "react";
import InstructorEmptyState from "../InstructorEmptyState";

const toBreakdownBars = (ratingBreakdown, totalReviews) => {
  const total = Number(totalReviews || 0);
  const source = ratingBreakdown || {};

  const rows = [
    { label: "5 ★", count: Number(source?.fivestar || source?.[5] || 0) },
    { label: "4 ★", count: Number(source?.fourstar || source?.[4] || 0) },
    { label: "3 ★", count: Number(source?.threestar || source?.[3] || 0) },
    { label: "2 ★", count: Number(source?.twostar || source?.[2] || 0) },
    { label: "1 ★", count: Number(source?.onestar || source?.[1] || 0) },
  ];

  return rows.map((row) => ({
    ...row,
    pct: total > 0 ? Math.round((row.count / total) * 100) : 0,
  }));
};

export default function IDReviews({ instructor, reviews = [], ratingStats = null, loadingReviews = false, reviewsError = null }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnimated(true), 100); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (!instructor) return null;

  if (loadingReviews && reviews.length === 0) {
    return (
      <InstructorEmptyState
        title="Loading Reviews"
        description="Gathering learner feedback and rating insights..."
        compact
      />
    );
  }

  if (reviewsError) {
    return (
      <InstructorEmptyState
        title="Reviews Unavailable"
        description={reviewsError}
        compact
      />
    );
  }

  const reviewItems = instructor.reviewItems || [];
  const totalReviews = Number(ratingStats?.totalReviews || instructor.reviews || 0);
  const averageRating = Number(ratingStats?.averageRating || instructor.rating || 0);
  const bars = toBreakdownBars(ratingStats?.ratingBreakdown || instructor.ratingBreakdown, totalReviews);

  return (
    <>
      <div className="id-review-summary ip-reveal" ref={ref}>
        <div>
          <div className="id-rs-big">{averageRating.toFixed(2)}</div>
          <div className="id-rs-stars">★★★★★</div>
          <div className="id-rs-count">{totalReviews.toLocaleString()} total reviews</div>
        </div>
        <div className="id-rating-bars">
          {bars.map((bar) => (
            <div key={bar.label} className="id-rb-row">
              <span className="id-rb-lbl">{bar.label}</span>
              <div className="id-rb-track">
                <div className={`id-rb-fill${animated ? " animated" : ""}`} style={{ width: `${bar.pct}%` }}/>
              </div>
              <span className="id-rb-pct">{bar.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="id-reviews-list">
        {reviewItems.length === 0 ? (
          <InstructorEmptyState
            title="No Reviews Yet"
            description="Be the first learner to leave feedback for this instructor."
            compact
          />
        ) : reviewItems.map((r, i) => (
          <div className="id-rev-item" key={i}>
            <div className="id-rev-hd">
              <div>
                <div className="id-rev-name">{r.name}</div>
                <div className="id-rev-meta">{r.course} · {r.date}</div>
              </div>
              <div className="id-rev-stars">{"★".repeat(Number(r.stars || 0))}</div>
            </div>
            <div className="id-rev-text">{r.text}</div>
          </div>
        ))}
      </div>
    </>
  );
}
