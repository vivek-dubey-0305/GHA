import { useEffect, useRef, useState } from "react";

const RATING_BARS = [
  { label: "5 ★", pct: 82 },
  { label: "4 ★", pct: 13 },
  { label: "3 ★", pct: 3 },
  { label: "2 ★", pct: 1 },
  { label: "1 ★", pct: 1 },
];

export default function IDReviews({ instructor }) {
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

  const reviews = instructor.reviewItems || [];

  return (
    <>
      <div className="id-review-summary ip-reveal" ref={ref}>
        <div>
          <div className="id-rs-big">{instructor.rating}</div>
          <div className="id-rs-stars">★★★★★</div>
          <div className="id-rs-count">{instructor.reviews.toLocaleString()} total reviews</div>
        </div>
        <div className="id-rating-bars">
          {RATING_BARS.map((bar) => (
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
        {reviews.map((r, i) => (
          <div className="id-rev-item" key={i}>
            <div className="id-rev-hd">
              <div>
                <div className="id-rev-name">{r.name}</div>
                <div className="id-rev-meta">{r.course} · {r.date}</div>
              </div>
              <div className="id-rev-stars">{"★".repeat(r.stars)}</div>
            </div>
            <div className="id-rev-text">{r.text}</div>
          </div>
        ))}
      </div>
    </>
  );
}
