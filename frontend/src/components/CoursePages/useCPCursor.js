import { useEffect, useRef } from "react";

/**
 * useCPCursor
 * Attaches the animated custom cursor used across course pages.
 * Call once at the top of the page component.
 * Returns refs to attach to the dot and ring elements.
 */
export default function useCPCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    document.addEventListener("mousemove", onMove);

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.left = mouse.current.x + "px";
        dotRef.current.style.top = mouse.current.y + "px";
      }
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      rafId.current = requestAnimationFrame(animate);
    };
    animate();

    // Grow on hover of interactive elements
    const grow = () => {
      if (dotRef.current) { dotRef.current.style.width = "20px"; dotRef.current.style.height = "20px"; }
      if (ringRef.current) { ringRef.current.style.width = "56px"; ringRef.current.style.height = "56px"; }
    };
    const shrink = () => {
      if (dotRef.current) { dotRef.current.style.width = "10px"; dotRef.current.style.height = "10px"; }
      if (ringRef.current) { ringRef.current.style.width = "34px"; ringRef.current.style.height = "34px"; }
    };

    const targets = document.querySelectorAll("a, button, [data-cursor]");
    targets.forEach((el) => {
      el.addEventListener("mouseenter", grow);
      el.addEventListener("mouseleave", shrink);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId.current);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", grow);
        el.removeEventListener("mouseleave", shrink);
      });
    };
  }, []);

  return { dotRef, ringRef };
}
