import { Link } from "react-router-dom";

const COURSE_CARDS = [
  {
    cat: "Design Systems", title: "UI/UX DESIGN SYSTEMS MASTERY",
    desc: "Build scalable design systems from first principles. Used by teams at Airbnb, Figma, and Stripe.",
    price: "₹4,999", oldPrice: "₹8,999", meta: "42 hrs · 6 projects",
    level: "Advanced", rating: "4.95",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <defs>
          <pattern id="ep-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0L0 0 0 30" fill="none" stroke="#f5c518" strokeWidth="0.15" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="400" height="200" fill="url(#ep-grid)"/>
        <g transform="translate(200,100)">
          <rect x="-50" y="-25" width="100" height="50" rx="3" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.7"/>
          <text x="0" y="7" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0.9" letterSpacing="1">DESIGN SYS</text>
          <line x1="-50" y1="0" x2="-100" y2="-40"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></line>
          <circle cx="-100" cy="-40" r="7" fill="#f5c518" opacity="0.4"/>
          <line x1="50" y1="0" x2="100" y2="-40"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite"/></line>
          <circle cx="100" cy="-40" r="7" fill="#f5c518" opacity="0.4"/>
          <line x1="0" y1="25" x2="0" y2="65"><animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/></line>
          <circle cx="0" cy="65" r="7" fill="#f5c518" opacity="0.4"/>
        </g>
      </svg>
    ),
  },
  {
    cat: "Full-Stack Dev", title: "REACT & NEXT.JS DEEPDIVE",
    desc: "Build scalable production apps with the modern React ecosystem. Server components and edge functions.",
    price: "₹3,999", oldPrice: "₹6,999", meta: "36 hrs · 8 builds",
    level: "Intermediate", rating: "4.8",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <g transform="translate(200,100)">
          <ellipse rx="100" ry="35" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse rx="100" ry="35" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate" from="60" to="420" dur="6s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse rx="100" ry="35" fill="none" stroke="#f5c518" strokeWidth="0.6" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="120" to="480" dur="10s" repeatCount="indefinite"/>
          </ellipse>
          <circle r="10" fill="#f5c518"><animate attributeName="r" values="10;14;10" dur="2.5s" repeatCount="indefinite"/></circle>
          <text x="0" y="40" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="16" fill="#f5c518" opacity="0.5" letterSpacing="3">REACT</text>
        </g>
      </svg>
    ),
  },
  {
    cat: "Data & AI", title: "ML ENGINEERING FROM SCRATCH",
    desc: "Build and deploy real ML models. PyTorch, transformers, fine-tuning LLMs, and production pipelines.",
    price: "₹5,499", oldPrice: "₹9,999", meta: "52 hrs · 6 projects",
    level: "Advanced", rating: "4.95",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <rect x="40" y="140" width="28" height="40" fill="#f5c518" opacity="0.6"><animate attributeName="height" values="40;80;40" dur="2s" repeatCount="indefinite"/><animate attributeName="y" values="140;100;140" dur="2s" repeatCount="indefinite"/></rect>
        <rect x="88" y="100" width="28" height="80" fill="#f5c518" opacity="0.8"><animate attributeName="height" values="80;50;80" dur="2.5s" repeatCount="indefinite"/><animate attributeName="y" values="100;130;100" dur="2.5s" repeatCount="indefinite"/></rect>
        <rect x="136" y="60" width="28" height="120" fill="#f5c518"><animate attributeName="height" values="120;90;120" dur="1.8s" repeatCount="indefinite"/><animate attributeName="y" values="60;90;60" dur="1.8s" repeatCount="indefinite"/></rect>
        <rect x="184" y="80" width="28" height="100" fill="#f5c518" opacity="0.7"><animate attributeName="height" values="100;130;100" dur="2.2s" repeatCount="indefinite"/></rect>
        <rect x="232" y="50" width="28" height="130" fill="#f5c518" opacity="0.9"><animate attributeName="height" values="130;100;130" dur="1.5s" repeatCount="indefinite"/></rect>
        <line x1="20" y1="180" x2="380" y2="180" stroke="#f5c518" strokeWidth="1" opacity="0.3"/>
        <text x="320" y="100" fontFamily="'Bebas Neue',sans-serif" fontSize="30" fill="#f5c518" opacity="0.25">AI</text>
      </svg>
    ),
  },
  {
    cat: "Cloud & DevOps", title: "AWS SOLUTIONS ARCHITECT PREP",
    desc: "Comprehensive AWS SAP certification prep with hands-on labs and real-world architecture scenarios.",
    price: "₹4,299", oldPrice: "₹7,499", meta: "52 hrs · 4 labs",
    level: "Advanced", rating: "4.85",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <defs><linearGradient id="ep-g4" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f5c518" stopOpacity="0.05"/><stop offset="100%" stopColor="#f5c518" stopOpacity="0.25"/></linearGradient></defs>
        <rect width="400" height="200" fill="url(#ep-g4)"/>
        <polyline points="20,160 60,140 100,148 140,100 180,80 220,90 260,50 300,60 340,30 380,20" fill="none" stroke="#f5c518" strokeWidth="2.5" strokeLinejoin="round" opacity="0.8"/>
        <polyline points="20,160 60,140 100,148 140,100 180,80 220,90 260,50 300,60 340,30 380,20 380,180 20,180" fill="#f5c518" opacity="0.05"/>
        <circle cx="380" cy="20" r="5" fill="#f5c518"><animate attributeName="r" values="5;8;5" dur="1.5s" repeatCount="indefinite"/></circle>
      </svg>
    ),
  },
  {
    cat: "Backend Dev", title: "NODE.JS MICROSERVICES",
    desc: "Design and deploy distributed systems. Event-driven architecture, Docker, Kubernetes at scale.",
    price: "₹3,999", oldPrice: "₹6,499", meta: "44 hrs · 4 systems",
    level: "Intermediate", rating: "4.6",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <g opacity="0.7">
          <circle cx="200" cy="100" r="8" fill="#f5c518"/>
          <circle cx="120" cy="60" r="5" fill="#f5c518" opacity="0.6"/>
          <circle cx="280" cy="60" r="5" fill="#f5c518" opacity="0.6"/>
          <circle cx="100" cy="150" r="5" fill="#f5c518" opacity="0.6"/>
          <circle cx="300" cy="150" r="5" fill="#f5c518" opacity="0.6"/>
          <line x1="200" y1="100" x2="120" y2="60" stroke="#f5c518" strokeWidth="0.8" opacity="0.5"/>
          <line x1="200" y1="100" x2="280" y2="60" stroke="#f5c518" strokeWidth="0.8" opacity="0.5"/>
          <line x1="200" y1="100" x2="100" y2="150" stroke="#f5c518" strokeWidth="0.8" opacity="0.5"/>
          <line x1="200" y1="100" x2="300" y2="150" stroke="#f5c518" strokeWidth="0.8" opacity="0.5"/>
        </g>
        <text x="200" y="34" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0.5" letterSpacing="2">MICROSERVICES</text>
      </svg>
    ),
  },
  {
    cat: "Cybersecurity", title: "ETHICAL HACKING & PENTESTING",
    desc: "Master ethical hacking with real-world CTF challenges. CEH exam prep included.",
    price: "₹4,999", oldPrice: "₹8,499", meta: "50 hrs · 7 labs",
    level: "Intermediate", rating: "4.9",
    visual: (
      <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="#141414"/>
        <rect x="0" y="0" width="400" height="2" fill="#f5c518" opacity="0.4">
          <animate attributeName="y" values="0;200;0" dur="2.5s" repeatCount="indefinite"/>
        </rect>
        <text x="20" y="50" fontFamily="'Space Mono',monospace" fontSize="11" fill="#f5c518" opacity="0.4">$ nmap -sV target.com</text>
        <text x="20" y="75" fontFamily="'Space Mono',monospace" fontSize="11" fill="#f5c518" opacity="0.6">PORT    STATE  SERVICE</text>
        <text x="20" y="100" fontFamily="'Space Mono',monospace" fontSize="11" fill="#f5c518" opacity="0.5">80/tcp  open   http</text>
        <text x="20" y="125" fontFamily="'Space Mono',monospace" fontSize="11" fill="#f5c518" opacity="0.5">443/tcp open   https</text>
        <text x="20" y="150" fontFamily="'Space Mono',monospace" fontSize="11" fill="#27ae60" opacity="0.7">22/tcp  open   ssh</text>
        <text x="20" y="175" fontFamily="'Space Mono',monospace" fontSize="11" fill="#e74c3c" opacity="0.6">3306/tcp open  mysql ⚠</text>
      </svg>
    ),
  },
];

export default function HPEditorsPick() {
  return (
    <>
      <section id="editors-pick" className="hp-editors-section">
        {/* Header */}
        <div className="hp-reveal">
          <div className="hp-section-tag">Spotlight</div>
          <div className="hp-section-title" style={{ marginBottom: 16 }}>EDITOR'S <em>PICK</em></div>
          <p className="hp-section-sub">Hand-selected courses delivering the highest transformation. These aren't just popular — they're life-changing.</p>
        </div>

        {/* Featured course */}
        <Link to="/courses/course_006" className="hp-featured-course hp-reveal" style={{ marginTop: 48 }}>
          <div className="hp-fc-visual">
            <svg viewBox="0 0 700 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style={{ width:"100%", height:"100%", position:"absolute", inset:0 }}>
              <rect width="700" height="500" fill="#111"/>
              <defs>
                <pattern id="hp-feat-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f5c518" strokeWidth="0.2" opacity="0.3"/>
                </pattern>
                <radialGradient id="hp-feat-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f5c518" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#f5c518" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <rect width="700" height="500" fill="url(#hp-feat-grid)"/>
              <ellipse cx="350" cy="250" rx="300" ry="200" fill="url(#hp-feat-grad)"/>
              <g transform="translate(350,250)">
                <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="none" stroke="#f5c518" strokeWidth="1">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
                </polygon>
                <polygon points="0,-80 69,-40 69,40 0,80 -69,40 -69,-40" fill="none" stroke="#f5c518" strokeWidth="1.5">
                  <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="14s" repeatCount="indefinite"/>
                </polygon>
                <circle r="14" fill="#f5c518">
                  <animate attributeName="r" values="14;20;14" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;0.6;1" dur="3s" repeatCount="indefinite"/>
                </circle>
              </g>
              <text x="350" y="460" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="90" fill="#f5c518" opacity="0.04" letterSpacing="12">GHA</text>
            </svg>
            <div className="hp-fc-badge">⭐ Bestseller</div>
            <div className="hp-fc-play">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M8 5L17 11L8 17V5Z" fill="#f5c518"/>
              </svg>
            </div>
          </div>
          <div className="hp-fc-info">
            <div className="hp-fc-category">● Design Systems & UI/UX</div>
            <div className="hp-fc-title">SYSTEMS THINKING FOR<br/>PRODUCT <span>DESIGN</span></div>
            <div className="hp-fc-desc">Build scalable, consistent design systems from first principles. The same methodology used by teams at Airbnb, Figma, Stripe, and Google. No templates — pure craft.</div>
            <div className="hp-fc-meta">
              <span><em>42 hours</em> of content</span>
              <span><em>18</em> modules</span>
              <span><em>Advanced</em></span>
              <span><em>4.95 ★</em></span>
            </div>
            <div className="hp-fc-footer">
              <div>
                <span className="hp-fc-price">₹4,999</span>
                <span className="hp-fc-price-old">₹9,999</span>
              </div>
              <button className="hp-fc-enroll">Enroll Now →</button>
            </div>
          </div>
        </Link>

        {/* Course grid heading */}
        {/* <div className="hp-reveal" style={{ marginTop: 80, marginBottom: 40 }}>
          <div className="hp-section-tag">Top Picks</div>
          <div className="hp-section-title">MOST <em>ENROLLED</em><br/>THIS MONTH</div>
        </div> */}

        {/* Filter bar */}
        {/* <div className="hp-filter-bar hp-reveal">
          {["All","Web Dev","AI/ML","DevOps","Security","Mobile","Backend"].map((cat, i) => (
            <button key={cat} className={`hp-filter-btn${i === 0 ? " active" : ""}`}
              onClick={(e) => {
                document.querySelectorAll(".hp-filter-btn").forEach(b => b.classList.remove("active"));
                e.currentTarget.classList.add("active");
              }}
            >{cat}</button>
          ))}
        </div> */}

        {/* Course grid */}
        {/* <div className="hp-course-grid hp-reveal">
          {COURSE_CARDS.map((c, i) => (
            <Link to="/courses" key={i} className="hp-course-card">
              <div className="hp-card-visual">
                {c.visual}
                <div className="hp-card-overlay" />
                <div className="hp-card-level">{c.level}</div>
                <div className="hp-card-rating">★ {c.rating}</div>
              </div>
              <div className="hp-card-body">
                <div className="hp-card-category">● {c.cat}</div>
                <div className="hp-card-title">{c.title}</div>
                <div className="hp-card-desc">{c.desc}</div>
                <div className="hp-card-footer">
                  <div className="hp-card-price">{c.price}</div>
                  <div className="hp-card-meta">{c.meta}</div>
                </div>
              </div>
              <div className="hp-card-hover-reveal" />
              <div className="hp-card-progress" />
            </Link>
          ))}
        </div> */}
      </section>

      <style>{`
        .hp-editors-section {
          position: relative; z-index: 1;
          padding: 100px 60px;
        }

        /* Featured course */
        .hp-featured-course {
          display: grid; grid-template-columns: 1.2fr 1fr;
          border: 1px solid rgba(245,197,24,0.18);
          overflow: hidden; transition: border-color 0.3s;
          cursor: pointer; text-decoration: none; color: inherit;
        }
        .hp-featured-course:hover { border-color: #f5c518; }
        .hp-fc-visual {
          position: relative; min-height: 480px; background: #1a1a1a; overflow: hidden;
        }
        .hp-fc-badge {
          position: absolute; top: 24px; left: 24px;
          background: #f5c518; color: #0a0a0a;
          padding: 6px 16px; z-index: 2;
          font-family: 'Space Mono', monospace;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
        }
        .hp-fc-play {
          position: absolute; bottom: 24px; right: 24px;
          width: 56px; height: 56px; border: 2px solid #f5c518; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; z-index: 2;
          transition: background 0.3s, transform 0.3s;
        }
        .hp-featured-course:hover .hp-fc-play { background: #f5c518; transform: scale(1.1); }
        .hp-fc-info {
          padding: 48px; background: #111;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .hp-fc-category {
          font-family: 'Space Mono', monospace;
          font-size: 0.68rem; color: #f5c518; letter-spacing: 3px;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .hp-fc-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 3.5vw, 56px); line-height: 0.95;
          letter-spacing: 2px; margin-bottom: 20px;
        }
        .hp-fc-title span { color: #f5c518; }
        .hp-fc-desc { font-size: 0.95rem; color: #888; line-height: 1.7; margin-bottom: 32px; }
        .hp-fc-meta {
          display: flex; gap: 24px; flex-wrap: wrap;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem; color: #888; margin-bottom: 32px;
        }
        .hp-fc-meta em { color: #f5f5f0; font-style: normal; }
        .hp-fc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .hp-fc-price { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: #f5c518; }
        .hp-fc-price-old { font-size: 0.85rem; color: #888; text-decoration: line-through; margin-left: 8px; }
        .hp-fc-enroll {
          background: #f5c518; color: #0a0a0a;
          padding: 14px 28px; font-weight: 700;
          font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase;
          border: none; cursor: none;
          clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
          transition: background 0.3s;
        }
        .hp-fc-enroll:hover { background: #fff; }

        /* Filter bar */
        .hp-filter-bar {
          display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px;
        }
        .hp-filter-btn {
          padding: 10px 22px; border: 1px solid rgba(255,255,255,0.12);
          background: transparent; color: #888;
          font-family: 'Space Mono', monospace;
          font-size: 0.68rem; letter-spacing: 2px; text-transform: uppercase;
          cursor: none; transition: all 0.3s;
          clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
        }
        .hp-filter-btn.active, .hp-filter-btn:hover {
          background: #f5c518; color: #0a0a0a;
          border-color: #f5c518; font-weight: 700;
        }

        /* Course grid */
        .hp-course-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: rgba(245,197,24,0.18);
          border: 1px solid rgba(245,197,24,0.18); overflow: hidden;
        }
        .hp-course-card {
          background: #111; position: relative; overflow: hidden;
          cursor: none; transition: transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
          text-decoration: none; color: inherit; display: block;
        }
        .hp-course-card:hover { z-index: 2; transform: scale(1.02); }
        .hp-card-visual { position: relative; height: 200px; overflow: hidden; }
        .hp-card-visual svg { width: 100%; height: 100%; transition: transform 0.4s; }
        .hp-course-card:hover .hp-card-visual svg { transform: scale(1.05); }
        .hp-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, #111 0%, transparent 60%);
          pointer-events: none;
        }
        .hp-card-level {
          position: absolute; top: 14px; right: 14px;
          font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 2px;
          padding: 4px 12px; background: rgba(10,10,10,0.8); color: #f5c518;
          border: 1px solid rgba(245,197,24,0.18); text-transform: uppercase;
        }
        .hp-card-rating {
          position: absolute; top: 14px; left: 14px;
          font-family: 'Space Mono', monospace; font-size: 0.65rem; color: #f5c518;
          background: rgba(10,10,10,0.85); padding: 4px 10px;
          border: 1px solid rgba(245,197,24,0.2);
        }
        .hp-card-body { padding: 24px; }
        .hp-card-category {
          font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #f5c518;
          letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px;
        }
        .hp-card-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.4rem; letter-spacing: 1px; line-height: 1.1;
          margin-bottom: 10px; transition: color 0.3s;
        }
        .hp-course-card:hover .hp-card-title { color: #f5c518; }
        .hp-card-desc { font-size: 0.82rem; color: #888; line-height: 1.6; margin-bottom: 20px; }
        .hp-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .hp-card-price { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; color: #f5c518; }
        .hp-card-meta { font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #888; text-align: right; }
        .hp-card-hover-reveal {
          position: absolute; inset: 0;
          background: rgba(245,197,24,0.03); border: 2px solid #f5c518;
          pointer-events: none; opacity: 0; transition: opacity 0.3s;
        }
        .hp-course-card:hover .hp-card-hover-reveal { opacity: 1; }
        .hp-card-progress {
          position: absolute; bottom: 0; left: 0;
          height: 2px; background: #f5c518; width: 0; transition: width 0.5s;
        }
        .hp-course-card:hover .hp-card-progress { width: 100%; }

        @media (max-width: 1024px) {
          .hp-featured-course { grid-template-columns: 1fr; }
          .hp-fc-visual { min-height: 280px; }
          .hp-course-grid { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 600px) {
          .hp-editors-section { padding: 80px 24px; }
          .hp-course-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
