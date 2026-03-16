import { useState, useEffect } from "react";
import ROADMAPS from "../../mock/roadmaps.js";

/* ── Topic card ── */
function TopicCard({ topic, color, index }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setVisible(true), index * 80);
  }, [index]);

  return (
    <div className={`pp-topic-card ${visible ? 'pp-tc-visible' : ''}`} style={{ '--color': color }}>
      <div className="pp-tc-dot" style={{ background: color }}/>
      <div className="pp-tc-text">{topic}</div>
    </div>
  );
}

/* ── Level Section ── */
function LevelSection({ level, roadmap, isSelected, onSelect }) {
  const topicsToShow = level.topics.slice(0, 6);
  
  return (
    <div className={`pp-level-section ${isSelected ? 'pp-ls-active' : ''}`} onClick={() => onSelect(level.level)}>
      <div className="pp-ls-header" style={{ borderColor: level.color || roadmap.color }}>
        <div className="pp-ls-badge" style={{ background: level.color || roadmap.color }}>
          LEVEL {level.level}
        </div>
        <div className="pp-ls-title">{level.title}</div>
        <div className="pp-ls-count">{level.topics.length} topics</div>
      </div>
      <div className="pp-ls-topics">
        {topicsToShow.map((topic, i) => (
          <TopicCard key={topic} topic={topic} color={level.color || roadmap.color} index={i} />
        ))}
        {level.topics.length > 6 && (
          <div className="pp-tc-more">+{level.topics.length - 6} more</div>
        )}
      </div>
      <div className="pp-ls-indicator" style={{ background: level.color || roadmap.color }}/>
    </div>
  );
}

/* ── SVG Tree Connector ── */
function TreeConnection({ color, positions }) {
  const padding = 20;
  const width = Math.max(...positions.map(p => p.x)) + padding;
  const height = Math.max(...positions.map(p => p.y)) + padding;

  // Draw connecting lines
  const paths = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const from = positions[i];
    const to = positions[i + 1];
    const cp1X = from.x + (to.x - from.x) * 0.3;
    const cp1Y = from.y + (to.y - from.y) * 0.5;
    const cp2X = from.x + (to.x - from.x) * 0.7;
    const cp2Y = from.y + (to.y - from.y) * 0.5;
    
    paths.push(`M${from.x},${from.y} C${cp1X},${cp1Y} ${cp2X},${cp2Y} ${to.x},${to.y}`);
  }

  return (
    <svg className="pp-tree-connection" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`ptc-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      {paths.map((path, i) => (
        <path key={i} d={path} fill="none" stroke={`url(#ptc-${Math.random()})`} strokeWidth="2" strokeLinecap="round"/>
      ))}
    </svg>
  );
}

/* ── Main Roadmap Viewer ── */
export default function PPRoadmapViewer({ selectedId }) {
  const roadmap = ROADMAPS.find(r => r.id === selectedId) || ROADMAPS[0];
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const currentLevel = roadmap.levels.find(l => l.level === selectedLevel);

  return (
    <>
      <section className="pp-viewer-tree">
        {/* Header */}
        <div className="pp-tree-header pp-reveal">
          <div className="pp-th-left">
            <div className="pp-section-tag">Roadmap</div>
            <div className="pp-section-title">
              {roadmap.icon} {roadmap.name.toUpperCase()}<br/>
              <em>PATH</em>
            </div>
            <p className="pp-section-sub">{roadmap.desc}</p>
          </div>
          <div className="pp-th-stats">
            {[
              { n: roadmap.totalTopics, label: "Topics" },
              { n: roadmap.totalProjects, label: "Projects" },
              { n: "5", label: "Levels" },
              { n: roadmap.duration, label: "Duration" },
            ].map((s) => (
              <div key={s.label} className="pp-th-stat">
                <div className="pp-ths-num" style={{ color: roadmap.color }}>{s.n}</div>
                <div className="pp-ths-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tree visualization */}
        <div className="pp-tree-container pp-reveal">
          <div className="pp-tree-levels">
            {roadmap.levels.map((level, idx) => (
              <LevelSection
                key={level.level}
                level={level}
                roadmap={roadmap}
                isSelected={selectedLevel === level.level}
                onSelect={setSelectedLevel}
              />
            ))}
          </div>

          {/* Connection overlay */}
          <div className="pp-tree-connections">
            {roadmap.levels.length > 1 && (
              <svg className="pp-connections-svg" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pp-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={roadmap.color} stopOpacity="0.5"/>
                    <stop offset="100%" stopColor={roadmap.color} stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                {roadmap.levels.map((level, idx) => {
                  if (idx >= roadmap.levels.length - 1) return null;
                  const nextLevel = roadmap.levels[idx + 1];
                  return (
                    <path
                      key={`conn-${idx}`}
                      d={`M 50% 0 Q 50% 50% 50% 100%`}
                      fill="none"
                      stroke={`url(#pp-grad-main)`}
                      strokeWidth="2"
                      opacity="0.3"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Details panel */}
        {currentLevel && (
          <div className={`pp-details-panel pp-reveal ${expandedDetails ? 'pp-dp-expanded' : ''}`}>
            <div className="pp-dp-header">
              <div className="pp-dp-level" style={{ background: currentLevel.color || roadmap.color }}>
                Level {currentLevel.level}
              </div>
              <div className="pp-dp-info">
                <div className="pp-dp-title">{currentLevel.title}</div>
                <div className="pp-dp-subtitle">{currentLevel.subtitle}</div>
              </div>
              <div className="pp-dp-duration">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1"/>
                  <path d="M7 3.5V7.5L10 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                {currentLevel.duration}
              </div>
            </div>

            <div className="pp-dp-content">
              <div className="pp-dp-section">
                <div className="pp-dps-title">Topics to Master</div>
                <div className="pp-dps-items">
                  {currentLevel.topics.map((topic) => (
                    <div key={topic} className="pp-dpi-item">
                      <span className="pp-dpi-dot" style={{ background: currentLevel.color || roadmap.color }}/>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {currentLevel.projects?.length > 0 && (
                <div className="pp-dp-section">
                  <div className="pp-dps-title">Build Projects</div>
                  <div className="pp-dps-items">
                    {currentLevel.projects.map((project) => (
                      <div key={project} className="pp-dpi-project">
                        <span className="pp-proj-icon">▶</span>
                        <span>{project}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="pp-dp-toggle" onClick={() => setExpandedDetails(!expandedDetails)}>
              {expandedDetails ? '▲ Collapse' : '▼ View Details'}
            </button>
          </div>
        )}
      </section>

      <style>{`
        /* ── TREE VIEWER ── */
        .pp-viewer-tree {
          position: relative; z-index: 1;
          padding: 80px 60px;
          background: linear-gradient(135deg, #0a0a0a 0%, #111 100%);
        }

        /* ── HEADER ── */
        .pp-tree-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 40px; flex-wrap: wrap; margin-bottom: 60px;
        }
        .pp-th-left { max-width: 560px; }
        .pp-th-stats {
          display: flex; gap: 0;
          border: 1px solid rgba(245,197,24,0.18);
          overflow: hidden; flex-shrink: 0;
        }
        .pp-th-stat {
          padding: 18px 24px; background: #111; text-align: center;
          border-right: 1px solid rgba(245,197,24,0.1);
        }
        .pp-th-stat:last-child { border-right: none; }
        .pp-ths-num {
          font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem;
          line-height: 1; margin-bottom: 4px;
        }
        .pp-ths-lbl {
          font-family: 'Space Mono', monospace; font-size: 0.55rem;
          color: #888; letter-spacing: 2px; text-transform: uppercase;
        }

        /* ── TREE CONTAINER ── */
        .pp-tree-container {
          position: relative;
          background: rgba(17,17,17,0.5);
          border: 1px solid rgba(245,197,24,0.12);
          border-radius: 8px;
          padding: 40px;
          margin-bottom: 60px;
          overflow-x: auto;
        }

        .pp-tree-levels {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px; min-height: 300px;
          position: relative; z-index: 2;
        }

        /* ── LEVEL SECTION ── */
        .pp-level-section {
          position: relative;
          background: #111;
          border: 2px solid rgba(245,197,24,0.08);
          border-radius: 6px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
          overflow: hidden;
        }
        .pp-level-section::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 0; background: var(--color);
          opacity: 0.05; transition: height 0.3s;
        }
        .pp-level-section:hover {
          border-color: var(--color);
          transform: translateY(-4px);
        }
        .pp-level-section:hover::before { height: 100%; }
        .pp-level-section.pp-ls-active {
          border-color: var(--color);
          background: linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(245,197,24,0.02) 100%);
          box-shadow: 0 0 40px rgba(245,197,24,0.1);
        }

        .pp-ls-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(245,197,24,0.15);
        }
        .pp-ls-badge {
          font-family: 'Space Mono', monospace; font-size: 0.55rem;
          font-weight: 700; letter-spacing: 2px; color: #0a0a0a;
          padding: 4px 10px; white-space: nowrap; flex-shrink: 0;
          clip-path: polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%);
        }
        .pp-ls-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem;
          letter-spacing: 1px; flex: 1; color: #fff;
        }
        .pp-ls-count {
          font-family: 'Space Mono', monospace; font-size: 0.55rem;
          color: #888; white-space: nowrap; flex-shrink: 0;
        }

        /* ── TOPICS GRID ── */
        .pp-ls-topics {
          display: grid; grid-template-columns: 1fr;
          gap: 8px;
        }

        /* ── TOPIC CARD ── */
        .pp-topic-card {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 4px;
          background: rgba(245,197,24,0.04);
          border: 1px solid rgba(245,197,24,0.1);
          font-size: 0.75rem; color: #ccc;
          transition: all 0.3s;
          opacity: 0; transform: translateX(-8px);
        }
        .pp-topic-card.pp-tc-visible {
          opacity: 1; transform: translateX(0);
        }
        .pp-level-section:hover .pp-topic-card {
          background: rgba(245,197,24,0.08);
          border-color: var(--color);
        }
        .pp-tc-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
        }
        .pp-tc-text {
          line-height: 1.3;
        }

        .pp-tc-more {
          display: flex; align-items: center; justify-content: center;
          padding: 8px 10px; font-size: 0.7rem;
          color: #666; font-style: italic;
        }

        /* ── LEVEL INDICATOR ── */
        .pp-ls-indicator {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; transform: scaleX(0); transform-origin: left;
          transition: transform 0.4s;
        }
        .pp-level-section.pp-ls-active .pp-ls-indicator { transform: scaleX(1); }

        /* ── CONNECTIONS ── */
        .pp-tree-connections {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 1;
        }
        .pp-connections-svg {
          width: 100%; height: 100%;
        }

        /* ── DETAILS PANEL ── */
        .pp-details-panel {
          background: linear-gradient(135deg, rgba(245,197,24,0.05) 0%, transparent 100%);
          border: 1px solid rgba(245,197,24,0.15);
          border-radius: 8px;
          padding: 28px;
          max-width: 900px; margin: 0 auto;
          opacity: 0; transform: translateY(20px);
          transition: all 0.5s ease;
        }
        .pp-details-panel.pp-reveal {
          opacity: 1; transform: translateY(0);
        }

        .pp-dp-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 24px; padding-bottom: 20px;
          border-bottom: 1px solid rgba(245,197,24,0.1);
        }
        .pp-dp-level {
          font-family: 'Space Mono', monospace; font-size: 0.6rem;
          font-weight: 700; letter-spacing: 2px; color: #0a0a0a;
          padding: 6px 14px; white-space: nowrap;
          clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
        }
        .pp-dp-info { flex: 1; }
        .pp-dp-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 1.3rem;
          letter-spacing: 1px; margin-bottom: 4px;
        }
        .pp-dp-subtitle {
          font-size: 0.85rem; color: #888;
        }
        .pp-dp-duration {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Space Mono', monospace; font-size: 0.75rem;
          color: #888; white-space: nowrap;
        }

        /* ── CONTENT ── */
        .pp-dp-content {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px; margin-bottom: 24px;
        }

        .pp-dp-section { }
        .pp-dps-title {
          font-family: 'Bebas Neue', sans-serif; font-size: 0.95rem;
          letter-spacing: 1px; margin-bottom: 12px; color: #f5c518;
        }
        .pp-dps-items {
          display: flex; flex-direction: column; gap: 8px;
        }
        .pp-dpi-item, .pp-dpi-project {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 4px;
          background: rgba(17,17,17,0.6); border: 1px solid rgba(245,197,24,0.08);
          font-size: 0.8rem; color: #ccc;
          transition: all 0.3s;
        }
        .pp-dpi-item:hover, .pp-dpi-project:hover {
          background: rgba(245,197,24,0.08);
          border-color: rgba(245,197,24,0.2);
        }
        .pp-dpi-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }
        .pp-proj-icon {
          color: #f5c518; font-size: 0.6rem; flex-shrink: 0;
        }

        /* ── TOGGLE ── */
        .pp-dp-toggle {
          width: 100%; padding: 12px 16px;
          background: rgba(245,197,24,0.08); border: 1px solid rgba(245,197,24,0.15);
          color: #f5c518; font-family: 'Space Mono', monospace;
          font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase;
          cursor: none; transition: all 0.3s;
          border-radius: 4px;
        }
        .pp-dp-toggle:hover {
          background: rgba(245,197,24,0.15);
          border-color: #f5c518;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .pp-viewer-tree { padding: 60px 40px; }
          .pp-tree-levels { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        }
        @media (max-width: 768px) {
          .pp-viewer-tree { padding: 40px 24px; }
          .pp-tree-header { flex-direction: column; gap: 24px; }
          .pp-tree-container { padding: 20px; }
          .pp-tree-levels { grid-template-columns: 1fr; }
          .pp-dp-content { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
