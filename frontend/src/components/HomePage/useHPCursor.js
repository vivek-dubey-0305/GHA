import { useEffect, useRef } from "react";

export default function useHPCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const mouse   = useRef({ x: 0, y: 0 });
  const ring    = useRef({ x: 0, y: 0 });
  const rafId   = useRef(null);

  useEffect(() => {
    const onMove = (e) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY; };
    document.addEventListener("mousemove", onMove);

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.left = mouse.current.x + "px";
        dotRef.current.style.top  = mouse.current.y + "px";
      }
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top  = ring.current.y + "px";
      }
      rafId.current = requestAnimationFrame(animate);
    };
    animate();

    const grow = () => {
      if (dotRef.current)  { dotRef.current.style.width  = "20px"; dotRef.current.style.height  = "20px"; }
      if (ringRef.current) { ringRef.current.style.width = "56px"; ringRef.current.style.height = "56px"; }
    };
    const shrink = () => {
      if (dotRef.current)  { dotRef.current.style.width  = "12px"; dotRef.current.style.height  = "12px"; }
      if (ringRef.current) { ringRef.current.style.width = "36px"; ringRef.current.style.height = "36px"; }
    };

    const onOver = (e) => {
      if (e.target.closest("a, button, .hp-course-card, .hp-filter-btn, .hp-instructor-card, .hp-cat-card, .hp-tab-btn")) grow();
      else shrink();
    };
    document.addEventListener("mouseover", onOver);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return { dotRef, ringRef };
}
