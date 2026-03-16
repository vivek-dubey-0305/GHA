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
    { target: instructor.students, label: "Students Taught", isCounter: true },
    { val: instructor.courses,     label: "Courses Created" },
    { val: instructor.rating,      label: "Avg Rating" },
    { target: instructor.reviews,  label: "Reviews", isCounter: true },
    { val: instructor.liveClasses, label: "Live Classes" },
    { val: `${instructor.exp} yrs`, label: "Experience" },
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
