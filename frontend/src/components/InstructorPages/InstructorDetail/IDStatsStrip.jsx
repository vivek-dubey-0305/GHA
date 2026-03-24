import { useEffect, useRef } from "react";

function animCounter(el, target) {
  let c = 0;
  const step = target / 80;
  const id = setInterval(() => {
    c += step;
    if (c >= target) { c = target; clearInterval(id); }
    el.textContent = Math.floor(c).toLocaleString();
  }, 14);
}

export default function IDStatsStrip({ instructor }) {
  const stripRef = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!stripRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        stripRef.current.querySelectorAll("[data-target]").forEach((el) =>
          animCounter(el, +el.dataset.target)
        );
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(stripRef.current);
    return () => obs.disconnect();
  }, []);

  const stats = [
    { target: Number(instructor.students || 0), label: "Students Taught", isCounter: true },
    { val: Number(instructor.courses || 0),     label: "Courses Created" },
    { val: Number(instructor.rating || 0).toFixed(2), label: "Avg Rating" },
    { target: Number(instructor.reviews || 0),  label: "Reviews", isCounter: true },
    { val: Number(instructor.liveClasses || 0), label: "Live Classes" },
    { val: `${Number(instructor.exp || 0)} yrs`, label: "Experience" },
  ];

  return (
    <div className="id-stats-strip ip-reveal" ref={stripRef}>
      {stats.map((s, i) => (
        <div className="id-ss-stat" key={i}>
          {s.isCounter
            ? <div className="id-ss-num" data-target={s.target}>0</div>
            : <div className="id-ss-num">{s.val}</div>
          }
          <div className="id-ss-lbl">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
