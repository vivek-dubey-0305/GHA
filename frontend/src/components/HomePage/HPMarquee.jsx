const ITEMS = [
  "Web Development", "Machine Learning", "Full-Stack Dev",
  "Data Science", "Cloud Computing", "Cybersecurity",
  "Mobile Development", "AI Engineering", "DevOps",
  "Career Prep", "System Design", "Blockchain",
];

export default function HPMarquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <>
      <div className="hp-marquee-wrapper">
        <div className="hp-marquee-track">
          {doubled.map((item, i) => (
            <span className="hp-marquee-item" key={i}>
              <span className="hp-marquee-dot">●</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .hp-marquee-wrapper {
          position: relative; z-index: 1;
          overflow: hidden;
          border-top: 1px solid rgba(245,197,24,0.18);
          border-bottom: 1px solid rgba(245,197,24,0.18);
          padding: 18px 0;
          background: rgba(245,197,24,0.03);
        }
        .hp-marquee-track {
          display: flex; gap: 0;
          animation: hpMarquee 32s linear infinite;
          white-space: nowrap; width: max-content;
        }
        .hp-marquee-track:hover { animation-play-state: paused; }
        @keyframes hpMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .hp-marquee-item {
          display: inline-flex; align-items: center; gap: 14px;
          padding: 0 32px;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem; letter-spacing: 3px;
          color: #888; text-transform: uppercase;
        }
        .hp-marquee-dot { color: #f5c518; font-size: 1rem; }
      `}</style>
    </>
  );
}
