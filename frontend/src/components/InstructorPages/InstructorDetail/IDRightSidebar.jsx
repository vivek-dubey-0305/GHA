import { useEffect, useRef, useState } from "react";

function SkillsCard({ skills }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTimeout(() => setAnimated(true), 100); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="id-skills-card ip-reveal" ref={ref}>
      <div className="id-sk-header">💻 Core Skills</div>
      <div className="id-sk-body">
        {skills.map((s) => (
          <div className="id-skill-item" key={s.name}>
            <div className="id-skill-label">
              <span className="id-skill-name">{s.name}</span>
              <span className="id-skill-pct">{s.pct}%</span>
            </div>
            <div className="id-skill-track">
              <div className={`id-skill-fill${animated ? " animated" : ""}`} style={{ width: `${s.pct}%` }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IDRightSidebar({ instructor }) {
  if (!instructor) return null;

  return (
    <div className="id-right-side">
      {/* Achievements */}
      <div className="id-achievement-card ip-reveal">
        <div className="id-ac-header">🏆 Achievements</div>
        <div className="id-ac-body">
          {(instructor.achievements || []).map((a, i) => (
            <div className="id-ach-item" key={i}>
              <div className="id-ach-icon">{a.icon}</div>
              <div>
                <div className="id-ach-title">{a.title}</div>
                <div className="id-ach-sub">{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <SkillsCard skills={instructor.skills || []}/>

      {/* Social */}
      <div className="id-social-card ip-reveal">
        <div className="id-soc-title">Connect</div>
        <div className="id-soc-links">
          {(instructor.social || []).map((s) => (
            <a key={s.label} href={s.url || "#"} className="id-soc-link">
              <span className="id-soc-link-ico">{s.icon}</span>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
