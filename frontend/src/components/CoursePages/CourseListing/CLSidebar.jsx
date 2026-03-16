import { useState } from "react";

function SidebarSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="cl-sb-section">
      <div className="cl-sb-head" onClick={() => setOpen((o) => !o)}>
        <span className="cl-sb-head-label">{label}</span>
        <span className={`cl-sb-arrow${open ? " open" : ""}`}>▶</span>
      </div>
      <div
        className="cl-sb-body"
        style={{
          maxHeight: open ? "600px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function CheckItem({ label, count, checked, onChange }) {
  return (
    <div className={`cl-cb-item${checked ? " checked" : ""}`} onClick={onChange}>
      <div className="cl-cb-box">
        <span className="cl-cb-check">✓</span>
      </div>
      <span className="cl-cb-label">{label}</span>
      {count !== undefined && <span className="cl-cb-count">{count}</span>}
    </div>
  );
}

function StarRow({ label, count, checked, onChange }) {
  return (
    <div className={`cl-star-row${checked ? " checked" : ""}`} onClick={onChange}>
      <div className="cl-cb-box" style={{ clipPath: "polygon(3px 0%,100% 0%,calc(100% - 3px) 100%,0% 100%)" }}>
        <span className="cl-cb-check">✓</span>
      </div>
      <span className="cl-sr-stars">★★★★★</span>
      <span className="cl-sr-label">{label}</span>
      <span className="cl-sr-count">{count}</span>
    </div>
  );
}

function ToggleRow({ label, active, onToggle }) {
  return (
    <div className="cl-toggle-row" onClick={onToggle}>
      <span className="cl-toggle-label">{label}</span>
      <div className={`cl-toggle${active ? " on" : ""}`}>
        <div className="cl-toggle-thumb" />
      </div>
    </div>
  );
}

export default function CLSidebar({ activeFilters, onToggleFilter, onToggleFlag, onClearAll, priceRange, onPriceRange }) {
  const [instrSearch, setInstrSearch] = useState("");

  const isChecked = (type, val) =>
    Array.isArray(activeFilters[type]) && activeFilters[type].includes(val);

  const isFlagOn = (flag) =>
    Array.isArray(activeFilters.flags) && activeFilters.flags.includes(flag);

  const isTopic = (t) =>
    Array.isArray(activeFilters.topics) && activeFilters.topics.includes(t);

  const instructors = [
    { name: "James Wright", count: 15 },
    { name: "Alex Chen", count: 12 },
    { name: "Sarah Kim", count: 8 },
    { name: "Maya Patel", count: 6 },
    { name: "Raj Mehta", count: 9 },
    { name: "Lena Shore", count: 7 },
  ];

  const topics = ["React", "Node.js", "Python", "Figma", "AWS", "TypeScript", "MongoDB", "Docker", "GraphQL"];
  const categories = [
    { label: "Web Development", count: 42 },
    { label: "Machine Learning", count: 18 },
    { label: "Design", count: 22 },
    { label: "DevOps", count: 14 },
    { label: "Mobile", count: 11 },
    { label: "Cybersecurity", count: 9 },
    { label: "Data Science", count: 16 },
    { label: "Business", count: 8 },
  ];

  return (
    <aside className="cl-sidebar" id="cl-sidebar">
      {/* CATEGORY */}
      <SidebarSection label="Category">
        {categories.map((c) => (
          <CheckItem
            key={c.label}
            label={c.label}
            count={c.count}
            checked={isChecked("category", c.label)}
            onChange={() => onToggleFilter("category", c.label)}
          />
        ))}
      </SidebarSection>

      {/* TOPICS */}
      <SidebarSection label="Topics">
        <div className="cl-topic-pills">
          {topics.map((t) => (
            <span
              key={t}
              className={`cl-topic-pill${isTopic(t) ? " active" : ""}`}
              onClick={() => onToggleFilter("topics", t)}
            >
              {t}
            </span>
          ))}
        </div>
      </SidebarSection>

      {/* LEVEL */}
      <SidebarSection label="Level">
        {["Beginner", "Intermediate", "Advanced", "All Levels"].map((l, i) => (
          <CheckItem
            key={l}
            label={l}
            count={[32, 54, 28, 6][i]}
            checked={isChecked("level", l)}
            onChange={() => onToggleFilter("level", l)}
          />
        ))}
      </SidebarSection>

      {/* LANGUAGE */}
      <SidebarSection label="Language">
        {[["English", 98], ["Hindi", 18], ["Spanish", 12]].map(([l, c]) => (
          <CheckItem
            key={l}
            label={l}
            count={c}
            checked={isChecked("language", l)}
            onChange={() => onToggleFilter("language", l)}
          />
        ))}
      </SidebarSection>

      {/* PRICE */}
      <SidebarSection label="Price">
        <CheckItem label="Free" count={8} checked={isChecked("price", "Free")} onChange={() => onToggleFilter("price", "Free")} />
        <CheckItem label="Paid" count={112} checked={isChecked("price", "Paid")} onChange={() => onToggleFilter("price", "Paid")} />
        <div className="cl-price-range-wrap" style={{ marginTop: 10 }}>
          <div className="cl-price-display">
            <span className="cl-price-val">${priceRange[0]}</span>
            <span className="cl-price-val">${priceRange[1]}</span>
          </div>
          <div className="cl-slider-dual">
            <div className="cl-range-bg" />
            <div
              className="cl-range-selected"
              style={{
                left: (priceRange[0] / 299) * 100 + "%",
                width: ((priceRange[1] - priceRange[0]) / 299) * 100 + "%",
              }}
            />
            <input
              type="range"
              className="cl-range-input"
              min={0}
              max={299}
              value={priceRange[0]}
              onChange={(e) => onPriceRange([+e.target.value, priceRange[1]])}
            />
            <input
              type="range"
              className="cl-range-input"
              min={0}
              max={299}
              value={priceRange[1]}
              onChange={(e) => onPriceRange([priceRange[0], +e.target.value])}
            />
          </div>
          <div className="cl-dur-labels"><span>$0</span><span>$299</span></div>
        </div>
      </SidebarSection>

      {/* RATINGS */}
      <SidebarSection label="Ratings">
        <StarRow label="4.5 & up" count={86} checked={isChecked("rating", "4.5+")} onChange={() => onToggleFilter("rating", "4.5+")} />
        <StarRow label="4.0 & up" count={112} checked={isChecked("rating", "4.0+")} onChange={() => onToggleFilter("rating", "4.0+")} />
        <StarRow label="3.5 & up" count={118} checked={isChecked("rating", "3.5+")} onChange={() => onToggleFilter("rating", "3.5+")} />
      </SidebarSection>

      {/* DURATION */}
      <SidebarSection label="Duration">
        {[["0-5 hrs", 20], ["5-20 hrs", 48], ["20+ hrs", 52]].map(([d, c]) => (
          <CheckItem key={d} label={d.replace("-", " – ")} count={c} checked={isChecked("duration", d)} onChange={() => onToggleFilter("duration", d)} />
        ))}
      </SidebarSection>

      {/* INSTRUCTOR */}
      <SidebarSection label="Instructor">
        <div className="cl-sb-search">
          <span className="cl-si">⌕</span>
          <input
            type="text"
            placeholder="Search instructor…"
            value={instrSearch}
            onChange={(e) => setInstrSearch(e.target.value)}
          />
        </div>
        <div id="cl-instructorList">
          {instructors
            .filter((i) => i.name.toLowerCase().includes(instrSearch.toLowerCase()))
            .map((i) => (
              <CheckItem
                key={i.name}
                label={i.name}
                count={i.count}
                checked={isChecked("instructor", i.name)}
                onChange={() => onToggleFilter("instructor", i.name)}
              />
            ))}
        </div>
      </SidebarSection>

      {/* PROJECTS */}
      <SidebarSection label="Projects">
        {[["1-3", 30], ["4-6", 52], ["7+", 38]].map(([p, c]) => (
          <CheckItem key={p} label={`${p.replace("-", " – ")} Projects`} count={c} checked={isChecked("projects", p)} onChange={() => onToggleFilter("projects", p)} />
        ))}
      </SidebarSection>

      {/* LEARNING STYLE */}
      <SidebarSection label="Learning Style">
        <ToggleRow label="Hands-On Practice" active={isFlagOn("hands-on")} onToggle={() => onToggleFlag("hands-on")} />
        <ToggleRow label="Internship Track" active={isFlagOn("internship")} onToggle={() => onToggleFlag("internship")} />
        <ToggleRow label="Certificate Included" active={isFlagOn("certificate")} onToggle={() => onToggleFlag("certificate")} />
        <ToggleRow label="Live Mentorship" active={isFlagOn("mentorship")} onToggle={() => onToggleFlag("mentorship")} />
        <ToggleRow label="Community Access" active={isFlagOn("community")} onToggle={() => onToggleFlag("community")} />
      </SidebarSection>

      <button className="cl-sb-reset" onClick={onClearAll}>↺ Reset All Filters</button>
    </aside>
  );
}
