import { useEffect } from "react";

export default function usePPReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = `${i * 0.06}s`;
          e.target.classList.add("pp-visible");
        }
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".pp-reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}
