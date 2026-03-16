import { useEffect } from "react";

export default function useHPReveal() {
  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = `${i * 0.05}s`;
            e.target.classList.add("hp-visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".hp-reveal").forEach((el) => obs.observe(el));

    // Parallax hero bg text
    const handleScroll = () => {
      const y = window.scrollY;
      const bgText = document.querySelector(".hp-hero-bg-text");
      if (bgText) bgText.style.transform = `translate(-50%, calc(-50% + ${y * 0.3}px))`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}
