import { useEffect, useState } from "react";

export default function IDScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div className="id-scroll-prog">
      <div className="id-scroll-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
