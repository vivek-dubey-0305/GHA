import { useState } from "react";

/* ── Collapsible section ── */
function Section({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="il-sb-sec">
      <div className="il-sb-hd" onClick={() => setOpen((o) => !o)}>
        <span className="il-sb-hd-lbl">{label}</span>
        <span className={`il-sb-arrow${open ? " open" : ""}`}>▶</span>
      </div>
      <div
        className="il-sb-body"
        style={{ maxHeight: open ? "600px" : "0px", overflow: "hidden", transition: "max-height .32s cubic-bezier(.4,0,.2,1)" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Checkbox item ── */
function CbItem({ label, checked, onChange }) {
  return (
    <div className={`il-cb-item${checked ? " checked" : ""}`} onClick={onChange}>
      <div className="il-cb-box"><span className="il-cb-check">✓</span></div>
      <span className="il-cb-lbl">{label}</span>
    </div>
  );
}

/* ── Star row ── */
function StarRow({ stars, label, checked, onChange }) {
  return (
    <div className={`il-star-row${checked ? " checked" : ""}`} onClick={onChange}>
      <div className="il-cb-box" style={{ clipPath:"polygon(3px 0%,100% 0%,calc(100% - 3px) 100%,0% 100%)" }}>
        <span className="il-cb-check">✓</span>
      </div>
      <span className="il-sr-stars">{stars}</span>
      <span className="il-sr-lbl">{label}</span>
    </div>
  );
}

export default function ILSidebar({ activeFilters, searchQuery, onSearch, onToggleFilter, onToggleTopic, onClearAll, expRange, onExpRange }) {
  const specs = ["Web Dev","Machine Learning","Design","Data Science","DevOps","Mobile","Cybersecurity","Business","Motion","Blockchain"];

  const isF  = (type, val) => Array.isArray(activeFilters[type]) && activeFilters[type].includes(val);
  const isTop = (t) => Array.isArray(activeFilters.spec) && activeFilters.spec.includes(t);

  return (
    <aside className="il-sidebar" id="il-sidebar">
      {/* SEARCH */}
      <div className="il-sb-sec" style={{ paddingTop: 0 }}>
        <div className="il-sb-hd" onClick={() => {}}>
          <span className="il-sb-hd-lbl">Search</span>
          <span className="il-sb-arrow open">▶</span>
        </div>
        <div className="il-sb-body" style={{ maxHeight: "70px", overflow: "hidden" }}>
          <div className="il-sb-input-wrap">
            <span className="il-sb-input-icon">⌕</span>
            <input
              type="text"
              className="il-sb-input"
              placeholder="Name, specialty…"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SPECIALIZATION */}
      <Section label="Specialization">
        <div className="il-topic-pills">
          {specs.map((s) => (
            <span key={s} className={`il-topic-pill${isTop(s) ? " active" : ""}`} onClick={() => onToggleTopic(s)}>
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/* RATING */}
      <Section label="Rating">
        <StarRow stars="★★★★★" label="4.8 & up" checked={isF("rating","4.8+")} onChange={() => onToggleFilter("rating","4.8+")} />
        <StarRow stars="★★★★½" label="4.5 & up" checked={isF("rating","4.5+")} onChange={() => onToggleFilter("rating","4.5+")} />
        <StarRow stars="★★★★☆" label="4.0 & up" checked={isF("rating","4.0+")} onChange={() => onToggleFilter("rating","4.0+")} />
      </Section>

      {/* STUDENTS TAUGHT */}
      <Section label="Students Taught">
        {[["1K+","1,000+"],["5K+","5,000+"],["20K+","20,000+"],["50K+","50,000+"]].map(([v,l]) => (
          <CbItem key={v} label={l} checked={isF("students",v)} onChange={() => onToggleFilter("students",v)} />
        ))}
      </Section>

      {/* TOTAL COURSES */}
      <Section label="Total Courses">
        {[["1-4","1 – 4 Courses"],["5-9","5 – 9 Courses"],["10+","10+ Courses"]].map(([v,l]) => (
          <CbItem key={v} label={l} checked={isF("courses",v)} onChange={() => onToggleFilter("courses",v)} />
        ))}
      </Section>

      {/* YEARS OF EXPERIENCE */}
      <Section label="Years of Experience">
        <div className="il-range-disp">
          <span className="il-range-val">{expRange[0]} yrs</span>
          <span className="il-range-val">{expRange[1] >= 20 ? "20+ yrs" : `${expRange[1]} yrs`}</span>
        </div>
        <div className="il-slider-dual">
          <div className="il-range-bg" />
          <div
            className="il-range-sel"
            style={{ left: `${(expRange[0] / 20) * 100}%`, width: `${((expRange[1] - expRange[0]) / 20) * 100}%` }}
          />
          <input type="range" className="il-range-input" min={0} max={20} value={expRange[0]}
            onChange={(e) => onExpRange([+e.target.value, expRange[1]])} />
          <input type="range" className="il-range-input" min={0} max={20} value={expRange[1]}
            onChange={(e) => onExpRange([expRange[0], +e.target.value])} />
        </div>
        <div className="il-range-lbl"><span>0</span><span>20+</span></div>
      </Section>

      {/* REVIEWS COUNT */}
      <Section label="Reviews Count">
        {[["500+","500+ Reviews"],["2K+","2,000+ Reviews"],["5K+","5,000+ Reviews"]].map(([v,l]) => (
          <CbItem key={v} label={l} checked={isF("reviews",v)} onChange={() => onToggleFilter("reviews",v)} />
        ))}
      </Section>

      {/* BACKGROUND */}
      <Section label="Background">
        {[["FAANG","FAANG / Big Tech"],["Startup","Startup / Scale-up"],["Research","Academic / Research"],["Mentor","Active Live Mentor"]].map(([v,l]) => (
          <CbItem key={v} label={l} checked={isF("company",v)} onChange={() => onToggleFilter("company",v)} />
        ))}
      </Section>

      <button className="il-sb-reset" onClick={onClearAll}>↺ Reset All Filters</button>
    </aside>
  );
}
