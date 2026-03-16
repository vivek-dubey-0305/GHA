const TESTIMONIALS = [
  {
    stars: 5,
    text: "GHA completely changed my career. I landed a Senior Developer role at a top startup within 4 months of completing the Full-Stack course. The real-world projects made all the difference.",
    name: "PRIYA SHARMA",
    role: "Senior Developer @ Razorpay",
  },
  {
    stars: 5,
    text: "The ML Engineering course is unmatched. Real-world projects, no hand-holding, just genuine depth. The mentorship sessions were worth the entire price alone. Worth every rupee.",
    name: "DANIEL FOSTER",
    role: "ML Engineer @ Anthropic",
  },
  {
    stars: 5,
    text: "I've taken courses on every major platform. GHA is in a completely different league. The curriculum stays current, the instructors are actual practitioners, and the community is incredible.",
    name: "ROHIT MEHTA",
    role: "CTO @ FinTech Startup",
  },
];

export default function HPTestimonials() {
  return (
    <>
      <section className="hp-testimonials-section">
        <div className="hp-reveal" style={{ marginBottom: 50 }}>
          <div className="hp-section-tag">Student Success</div>
          <div className="hp-section-title">WHAT STUDENTS<br/><em>SAY</em></div>
          <p className="hp-section-sub">Real learners. Real jobs. Real salary jumps. No fluff.</p>
        </div>

        <div className="hp-testimonials hp-reveal">
          {TESTIMONIALS.map((t, i) => (
            <div className="hp-testimonial" key={i}>
              <div className="hp-stars">{"★".repeat(t.stars)}</div>
              <div className="hp-testimonial-text">"{t.text}"</div>
              <div className="hp-testimonial-author">{t.name}</div>
              <div className="hp-testimonial-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .hp-testimonials-section {
          position: relative; z-index: 1;
          padding: 0 60px 100px;
        }
        .hp-testimonials {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: rgba(245,197,24,0.18);
          border: 1px solid rgba(245,197,24,0.18);
        }
        .hp-testimonial {
          background: #111; padding: 40px;
          position: relative; transition: background 0.3s;
        }
        .hp-testimonial:hover { background: #151515; }
        .hp-testimonial::before {
          content: '"';
          position: absolute; top: 20px; right: 28px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 80px; color: #f5c518; opacity: 0.12; line-height: 1;
        }
        .hp-stars { color: #f5c518; font-size: 0.85rem; margin-bottom: 16px; letter-spacing: 2px; }
        .hp-testimonial-text {
          font-size: 0.92rem; color: #888; line-height: 1.8;
          margin-bottom: 24px; font-style: italic;
        }
        .hp-testimonial-author {
          font-family: 'Space Mono', monospace;
          font-size: 0.68rem; color: #f5f5f0; letter-spacing: 1px;
        }
        .hp-testimonial-role { font-size: 0.72rem; color: #f5c518; margin-top: 4px; }
        @media (max-width: 900px) { .hp-testimonials { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .hp-testimonials-section { padding: 0 24px 80px; } }
      `}</style>
    </>
  );
}
