import { useEffect } from "react";

/**
 * useCPReveal
 * Watches all elements with `.cp-reveal` class and adds `.cp-visible` when they enter viewport.
 * Call once per page.
 */
export default function useCPReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("cp-visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const els = document.querySelectorAll(".cp-reveal");
    els.forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);
}
