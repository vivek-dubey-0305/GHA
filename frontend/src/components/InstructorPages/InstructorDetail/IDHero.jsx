import { useState } from "react";

function QuickCard({ instructor }) {
  const [following, setFollowing] = useState(false);
  const fmt = (n) => (n >= 1000 ? (Math.round(n / 100) / 10) + "K" : String(n));

  return (
    <div className="id-hero-card" id="id-heroCard">
      <div className="id-hc-label">Quick Stats</div>

      {[
        { ico: "👥", key: "Students",     val: fmt(instructor.students) },
        { ico: "⭐", key: "Rating",       val: instructor.rating },
        { ico: "📚", key: "Courses",      val: instructor.courses },
        { ico: "💬", key: "Reviews",      val: fmt(instructor.reviews) },
        { ico: "📅", key: "Exp.",         val: `${instructor.exp} yrs` },
        { ico: "🎙", key: "Live Classes", val: instructor.liveClasses },
      ].map(({ ico, key, val }) => (
        <div className="id-hc-stat-row" key={key}>
          <span className="id-hc-stat-key">
            <span className="id-hc-stat-ico">{ico}</span> {key}
          </span>
          <span className="id-hc-stat-val">{val}</span>
        </div>
      ))}

      <button className="id-contact-btn">
        <span>Book Live Session →</span>
      </button>
      <button
        className={`id-follow-btn${following ? " following" : ""}`}
        onClick={() => setFollowing((f) => !f)}
      >
        {following ? "✓ Following" : "+ Follow Instructor"}
      </button>
    </div>
  );
}

export default function IDHero({ instructor }) {
  if (!instructor) return null;

  const badgeMap = {
    top:      { cls: "id-hb-top",      label: "⭐ Top Instructor" },
    verified: { cls: "id-hb-verified", label: "✓ Verified Expert" },
    mentor:   { cls: "id-hb-mentor",   label: "🎙 Live Mentor" },
  };

  const [first, ...rest] = instructor.name.split(" ");

  return (
    <div className="id-hero">
      {/* BANNER */}
      <div className="id-hero-banner">
        <svg className="id-hero-banner-svg" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <rect width="1440" height="320" fill={instructor.bannerColor || "#0d1500"}/>
          <defs>
            <pattern id="id-hgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0L0 0 0 40" fill="none" stroke="#f5c518" strokeWidth=".2" opacity=".3"/>
            </pattern>
            <radialGradient id="id-hrad" cx="30%" cy="60%" r="60%">
              <stop offset="0%" stopColor="#f5c518" stopOpacity=".14"/>
              <stop offset="100%" stopColor="#f5c518" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="id-hrad2" cx="80%" cy="40%" r="40%">
              <stop offset="0%" stopColor="#27ae60" stopOpacity=".06"/>
              <stop offset="100%" stopColor="#27ae60" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1440" height="320" fill="url(#id-hgrid)"/>
          <ellipse cx="430" cy="190" rx="380" ry="200" fill="url(#id-hrad)"/>
          <ellipse cx="1150" cy="130" rx="280" ry="160" fill="url(#id-hrad2)"/>
          <g opacity=".35">
            <path d="M0,160 L200,160 L240,120 L400,120 L440,160 L700,160" fill="none" stroke="#f5c518" strokeWidth=".8">
              <animate attributeName="stroke-dashoffset" values="0;-400;0" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dasharray" values="400,800" dur="2s" fill="freeze"/>
            </path>
            <path d="M700,200 L900,200 L940,160 L1100,160 L1140,200 L1440,200" fill="none" stroke="#f5c518" strokeWidth=".6" opacity=".5">
              <animate attributeName="stroke-dashoffset" values="0;-300;0" dur="10s" repeatCount="indefinite"/>
            </path>
            <line x1="0" y1="80" x2="1440" y2="80" stroke="#f5c518" strokeWidth=".2" opacity=".2"/>
            <line x1="0" y1="240" x2="1440" y2="240" stroke="#f5c518" strokeWidth=".2" opacity=".2"/>
          </g>
          <g opacity=".6">
            <circle cx="240" cy="120" r="4" fill="#f5c518"><animate attributeName="r" values="4;7;4" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="440" cy="160" r="3" fill="#f5c518" opacity=".7"><animate attributeName="r" values="3;5;3" dur="2.5s" begin=".5s" repeatCount="indefinite"/></circle>
            <circle cx="940" cy="160" r="4" fill="#f5c518"><animate attributeName="r" values="4;7;4" dur="3.5s" begin="1s" repeatCount="indefinite"/></circle>
            <circle cx="1140" cy="200" r="3" fill="#f5c518" opacity=".6"><animate attributeName="r" values="3;5;3" dur="2s" begin="1.5s" repeatCount="indefinite"/></circle>
          </g>
          <text x="720" y="270" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="200" fill="#f5c518" opacity=".025" letterSpacing="20">GHA</text>
        </svg>
        <div className="id-hero-banner-overlay"/>
      </div>

      {/* CONTENT */}
      <div className="id-hero-content">
        <div className="id-hero-row">
          {/* Avatar */}
          <div className="id-avatar-wrap">
            <div className="id-avatar-ring">
              <img src={instructor.img} alt={instructor.name}/>
            </div>
            <div className="id-online-dot"/>
          </div>

          {/* Info */}
          <div className="id-hero-info">
            <div className="id-hero-badges">
              {(instructor.badges || []).filter(b => badgeMap[b]).map((b) => (
                <span key={b} className={`id-hbadge ${badgeMap[b].cls}`}>{badgeMap[b].label}</span>
              ))}
            </div>

            <div className="id-hero-name">
              {first}<br/><span>{rest.join(" ")}</span>
            </div>
            <div className="id-hero-title-text">{instructor.title}</div>
            <div className="id-hero-desc">{instructor.bio}</div>
            <div className="id-hero-tags">
              {(instructor.specs || []).map((s) => (
                <span key={s} className="id-htag">{s}</span>
              ))}
            </div>
          </div>

          {/* Quick card */}
          <QuickCard instructor={instructor}/>
        </div>
      </div>
    </div>
  );
}
