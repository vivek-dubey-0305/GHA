import { Link } from "react-router-dom";

const INSTRUCTORS = [
  {
    id: 1,
    name: "ALEX CHEN",
    role: "Design Lead, Figma",
    stat: "12 courses · 18K students",
    color: "#f5c518",
    shape: "circle",
  },
  {
    id: 2,
    name: "SARAH KIM",
    role: "ML Researcher, DeepMind",
    stat: "8 courses · 24K students",
    color: "#3498db",
    shape: "diamond",
  },
  {
    id: 3,
    name: "JAMES WRIGHT",
    role: "Staff Engineer, Stripe",
    stat: "15 courses · 31K students",
    color: "#27ae60",
    shape: "triangle",
  },
  {
    id: 4,
    name: "MAYA PATEL",
    role: "Brand Director, Nike",
    stat: "6 courses · 14K students",
    color: "#e67e22",
    shape: "star",
  },
];

function AvatarSVG({ color, shape }) {
  return (
    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" style={{ width:"100%", height:"100%" }}>
      <rect width="72" height="72" fill="#1a1a1a"/>
      <circle cx="36" cy="28" r="14" fill={color} opacity="0.75"/>
      <ellipse cx="36" cy="65" rx="22" ry="16" fill={color} opacity="0.45"/>
      {shape === "diamond" && <rect x="30" y="18" width="12" height="12" fill="#0a0a0a" opacity="0.25" transform="rotate(45 36 24)"/>}
      {shape === "triangle" && <polygon points="36,18 44,30 28,30" fill="#0a0a0a" opacity="0.2"/>}
      {shape === "star" && <polygon points="36,20 38,26 44,26 40,30 42,36 36,32 30,36 32,30 28,26 34,26" fill="#0a0a0a" opacity="0.25"/>}
    </svg>
  );
}

export default function HPInstructors() {
  return (
    <>
      <section className="hp-instructors-section">
        <div className="hp-reveal" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:50, flexWrap:"wrap", gap:20 }}>
          <div>
            <div className="hp-section-tag">Expert Faculty</div>
            <div className="hp-section-title">LEARN FROM<br/>THE <em>BEST</em></div>
          </div>
          <Link to="/instructors" className="hp-btn-secondary">
            View All Instructors →
          </Link>
        </div>

        <div className="hp-instructors-grid hp-reveal">
          {INSTRUCTORS.map((inst) => (
            <Link to={`/instructors/${inst.id}`} key={inst.id} className="hp-instructor-card">
              <div className="hp-instructor-avatar">
                <AvatarSVG color={inst.color} shape={inst.shape}/>
              </div>
              <div className="hp-instructor-name">{inst.name}</div>
              <div className="hp-instructor-role">{inst.role}</div>
              <div className="hp-instructor-stat">{inst.stat}</div>
              <div className="hp-instructor-top-bar"/>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        .hp-instructors-section {
          position: relative; z-index: 1;
          padding: 0 60px 100px;
        }
        .hp-instructors-grid {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 24px;
        }
        .hp-instructor-card {
          border: 1px solid rgba(245,197,24,0.18);
          padding: 28px; text-align: center;
          transition: border-color 0.3s, transform 0.3s;
          position: relative; overflow: hidden;
          text-decoration: none; color: inherit;
          cursor: none; display: block;
        }
        .hp-instructor-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: #f5c518; transform: scaleX(0); transform-origin: left;
          transition: transform 0.3s;
        }
        .hp-instructor-card:hover .hp-instructor-top-bar { transform: scaleX(1); }
        .hp-instructor-card:hover { border-color: #f5c518; transform: translateY(-4px); }
        .hp-instructor-avatar {
          width: 72px; height: 72px; margin: 0 auto 16px;
          border-radius: 50%; overflow: hidden;
          border: 2px solid rgba(245,197,24,0.18);
          transition: border-color 0.3s;
        }
        .hp-instructor-card:hover .hp-instructor-avatar { border-color: #f5c518; }
        .hp-instructor-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem; letter-spacing: 1px; margin-bottom: 4px;
        }
        .hp-instructor-role {
          font-size: 0.72rem; color: #f5c518;
          font-family: 'Space Mono', monospace;
          letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;
        }
        .hp-instructor-stat { font-size: 0.78rem; color: #888; }
        @media (max-width: 900px) { .hp-instructors-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) {
          .hp-instructors-section { padding: 0 24px 80px; }
          .hp-instructors-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
