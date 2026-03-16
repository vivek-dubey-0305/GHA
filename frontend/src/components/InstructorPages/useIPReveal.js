import { useEffect } from "react";

export default function useIPReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("ip-visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".ip-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
