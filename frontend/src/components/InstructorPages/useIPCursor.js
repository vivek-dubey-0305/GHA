import { useEffect, useRef } from "react";

export default function useIPCursor() {
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
      if (dotRef.current)  { dotRef.current.style.width  = "18px"; dotRef.current.style.height  = "18px"; }
      if (ringRef.current) { ringRef.current.style.width = "52px"; ringRef.current.style.height = "52px"; }
    };
    const shrink = () => {
      if (dotRef.current)  { dotRef.current.style.width  = "10px"; dotRef.current.style.height  = "10px"; }
      if (ringRef.current) { ringRef.current.style.width = "34px"; ringRef.current.style.height = "34px"; }
    };

    const onOver = (e) => {
      const interactive = e.target.closest(
        "a,button,.il-card,.id-mc-card,.id-spec-card,.id-qual-item,.id-tl-item,.id-rev-item,.id-soc-link,.il-cb-item,.il-star-row,.il-topic-pill"
      );
      if (interactive) grow(); else shrink();
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
