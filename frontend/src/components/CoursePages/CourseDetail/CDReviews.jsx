import { useEffect, useRef, useState } from "react";

const MOCK_REVIEWS = [
  {
    name: "PRIYA SHARMA",
    date: "March 2025",
    stars: 5,
    text: "Absolutely incredible. I've taken every course available and this one is in a different league entirely. The teaching style is methodical yet engaging. I implemented the framework at my company and we shipped our product in 6 weeks instead of the planned 6 months.",
  },
  {
    name: "DANIEL FOSTER",
    date: "February 2025",
    stars: 5,
    text: "The depth of content here is unmatched. Every lesson builds on the last with clear, actionable examples. I went from beginner to confidently building production-ready applications. Worth every penny.",
  },
  {
    name: "KENJI TANAKA",
    date: "January 2025",
    stars: 5,
    text: "Best technical course I've ever taken. The instructor explains complex concepts in a way that actually sticks. Already got a new job offer because of the skills I learned here.",
  },
];

const RATING_BARS = [
  { label: "5 ★", pct: 88 },
  { label: "4 ★", pct: 9 },
  { label: "3 ★", pct: 2 },
  { label: "2 ★", pct: 1 },
  { label: "1 ★", pct: 0.5 },
];

export default function CDReviews({ course }) {
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef(null);

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

  return (
    <>
      {/* Summary */}
      <div className="cd-review-summary cp-reveal" ref={sectionRef}>
        <div>
          <div className="cd-review-big-num">{course.rating || "4.9"}</div>
          <div className="cd-review-stars-lg">★★★★★</div>
          <div className="cd-review-count">
            {(course.totalReviews || 0).toLocaleString()} ratings
          </div>
        </div>
        <div className="cd-rating-bars">
          {RATING_BARS.map((bar) => (
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
        {MOCK_REVIEWS.map((r, i) => (
          <div key={i} className="cd-review-item">
            <div className="cd-review-header">
              <div>
                <div className="cd-reviewer-name">{r.name}</div>
                <div className="cd-review-date">{r.date}</div>
              </div>
              <div className="cd-review-stars">{"★".repeat(r.stars)}</div>
            </div>
            <div className="cd-review-text">{r.text}</div>
          </div>
        ))}
      </div>
    </>
  );
}
