import { useNavigate } from "react-router-dom";

const COLORS = ["#f5c518","#3498db","#27ae60","#e74c3c","#9b59b6","#e67e22"];

const BADGE_MAP = {
  top:      { cls: "ib-top",      label: "⭐ Top Instructor" },
  verified: { cls: "ib-verified", label: "✓ Verified" },
  mentor:   { cls: "ib-mentor",   label: "🎙 Live Mentor" },
  new:      { cls: "ib-new",      label: "New" },
};

function Stars({ rating }) {
  const safeRating = Number(rating || 0);
  const full = Math.floor(safeRating), half = safeRating % 1 >= 0.5;
  return (
    <span className="il-stars">
      {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - Math.ceil(safeRating))}
    </span>
  );
}

function fmtNum(n) { return n >= 1000 ? Math.round(n / 100) / 10 + "K" : String(n); }

/* ── Animated banner SVG per card index ── */
function BannerSVG({ instructor, idx }) {
  const c  = COLORS[idx % COLORS.length];
  const bg = instructor.bannerColor || "#0d1a0a";
  const pid = `ip-g-${idx}`;

  const shapes = [
    <><circle cx="60" cy="55" r="38" fill="none" stroke={c} strokeWidth=".8" opacity=".5">
        <animate attributeName="r" values="38;46;38" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="60" cy="55" r="22" fill={c} opacity=".08"/>
      <line x1="0" y1="55" x2="400" y2="55" stroke={c} strokeWidth=".3" opacity=".3"/>
    </>,
    <polygon points="200,10 380,100 380,190 200,200 20,190 20,100" fill="none" stroke={c} strokeWidth=".6" opacity=".35">
      <animateTransform attributeName="transform" type="rotate" from="0 200 105" to="360 200 105" dur="60s" repeatCount="indefinite"/>
    </polygon>,
    <path d="M0,80 Q100,20 200,80 Q300,140 400,80" fill="none" stroke={c} strokeWidth="1.5" opacity=".5">
      <animate attributeName="d" values="M0,80 Q100,20 200,80 Q300,140 400,80;M0,80 Q100,140 200,80 Q300,20 400,80;M0,80 Q100,20 200,80 Q300,140 400,80" dur="5s" repeatCount="indefinite"/>
    </path>,
    <rect x="140" y="20" width="120" height="70" rx="3" fill="none" stroke={c} strokeWidth=".8" opacity=".4">
      <animateTransform attributeName="transform" type="rotate" from="0 200 55" to="360 200 55" dur="30s" repeatCount="indefinite"/>
    </rect>,
    <><circle cx="200" cy="55" r="45" fill="none" stroke={c} strokeWidth=".7" opacity=".4"/>
      <circle cx="200" cy="55" r="28" fill="none" stroke={c} strokeWidth="1" opacity=".6">
        <animate attributeName="r" values="28;35;28" dur="3s" repeatCount="indefinite"/>
      </circle>
    </>,
    <><line x1="0" y1="0" x2="400" y2="110" stroke={c} strokeWidth=".5" opacity=".3"/>
      <line x1="400" y1="0" x2="0" y2="110" stroke={c} strokeWidth=".5" opacity=".3"/>
      <circle cx="200" cy="55" r="10" fill={c} opacity=".5">
        <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite"/>
      </circle>
    </>,
  ];

  return (
    <svg className="il-banner-svg" viewBox="0 0 400 110" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="110" fill={bg}/>
      <defs>
        <pattern id={pid} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0L0 0 0 28" fill="none" stroke={c} strokeWidth=".18" opacity=".25"/>
        </pattern>
      </defs>
      <rect width="400" height="110" fill={`url(#${pid})`}/>
      {shapes[idx % shapes.length]}
      <text x="380" y="96" textAnchor="end" fontFamily="'Bebas Neue',sans-serif" fontSize="36" fill={c} opacity=".07" letterSpacing="4">
        {(instructor.specs?.[0] || "").toUpperCase()}
      </text>
    </svg>
  );
}

export default function ILInstructorCard({ instructor, viewMode, index }) {
  const navigate = useNavigate();
  const isList   = viewMode === "list";

  return (
    <div
      className={`il-card${isList ? " list-card" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => navigate(`/instructors/${instructor.id}`)}
    >
      {/* BANNER */}
      <div className="il-banner">
        <BannerSVG instructor={instructor} idx={index} />
        <div className="il-banner-overlay" />

        {/* BADGES */}
        <div className="il-b-badges">
          {(instructor.badges || []).map((b) => (
            <span key={b} className={`il-badge ${BADGE_MAP[b]?.cls}`}>
              {BADGE_MAP[b]?.label}
            </span>
          ))}
        </div>

        {/* AVATAR */}
        <div className="il-avatar-wrap">
          <img src={instructor.img} alt={instructor.name} loading="lazy" />
        </div>
      </div>

      {/* BODY */}
      <div className="il-body">
        <div className="il-name">{instructor.name}</div>
        <div className="il-title">{instructor.title}</div>

        <div className="il-spec-tags">
          {(instructor.specs || []).map((s) => <span key={s} className="il-spec">{s}</span>)}
        </div>

        <div className="il-bio">{instructor.bio}</div>

        {/* STATS 2x2 grid */}
        <div className="il-stats">
          <div className="il-stat">
            <div className="il-stat-num">{fmtNum(instructor.students)}</div>
            <div className="il-stat-lbl">Students</div>
          </div>
          <div className="il-stat">
            <div className="il-stat-num">{instructor.courses}</div>
            <div className="il-stat-lbl">Courses</div>
          </div>
          <div className="il-stat">
            <div className="il-stat-num">{instructor.exp}yr</div>
            <div className="il-stat-lbl">Exp.</div>
          </div>
          <div className="il-stat">
            <div className="il-stat-num">{instructor.liveClasses}</div>
            <div className="il-stat-lbl">Live</div>
          </div>
        </div>

        {/* RATING */}
        <div className="il-rating-row">
          <Stars rating={instructor.rating} />
          <span className="il-rating-num">{instructor.rating}</span>
          <span className="il-reviews">({Number(instructor.reviews || 0).toLocaleString()} reviews)</span>
        </div>

        {/* FOOTER */}
        <div className="il-footer">
          <span className="il-exp"><em>{instructor.exp}</em> yrs experience</span>
          <button className="il-view-btn-card" onClick={(e) => { e.stopPropagation(); navigate(`/instructors/${instructor.id}`); }}>
            View Profile →
          </button>
        </div>
      </div>

      <div className="il-hover-border" />
      <div className="il-progress" />
    </div>
  );
}
