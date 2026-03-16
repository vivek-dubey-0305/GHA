import { useEffect, useState } from "react";

export default function HPLoader() {
  const [visible, setVisible] = useState(true);
  const [exit, setExit]       = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const exitTimer = setTimeout(() => setExit(true), 2400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, 3000);
    return () => { clearTimeout(exitTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className={`hp-loader-root${exit ? " hp-loader-exit" : ""}`}>
        {/* SVG Thread Animation */}
        <svg className="hp-thread-svg" viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg">
          <path className="hp-thread-g"  d="M 30 40 A 30 30 0 1 0 60 70 L 60 70 L 45 70" />
          <path className="hp-thread-h"  d="M 90 30 L 90 110 M 90 70 L 130 70 M 130 30 L 130 110" />
          <path className="hp-thread-a"  d="M 160 110 L 190 30 L 220 110 M 170 78 L 210 78" />
          <path className="hp-thread-wave" d="M 0 125 Q 70 110 140 125 Q 210 140 280 125" />
        </svg>

        <div className="hp-load-label">GREED HUNTER</div>
        <div className="hp-load-sub">Academe — Fuel Your Ambition</div>

        <div className="hp-load-bar-wrap">
          <div className="hp-load-bar" />
        </div>
      </div>

      <style>{`
        .hp-loader-root {
          position: fixed; inset: 0;
          background: #080808;
          z-index: 10000;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 16px;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .hp-loader-exit {
          opacity: 0;
          transform: translateY(-20px);
        }
        .hp-thread-svg { width: 280px; height: 140px; overflow: visible; }
        .hp-thread-g {
          stroke: #f5c518; stroke-width: 2.5; fill: none;
          stroke-dasharray: 900; stroke-dashoffset: 900;
          animation: hpDrawThread 1.6s cubic-bezier(.77,0,.175,1) forwards;
          filter: drop-shadow(0 0 6px rgba(245,197,24,0.7));
        }
        .hp-thread-h {
          stroke: #c9a10e; stroke-width: 1.5; fill: none;
          stroke-dasharray: 600; stroke-dashoffset: 600;
          animation: hpDrawThread 1.4s 0.3s cubic-bezier(.77,0,.175,1) forwards;
          filter: drop-shadow(0 0 3px rgba(245,197,24,0.5));
        }
        .hp-thread-a {
          stroke: #f5f5f0; stroke-width: 1.5; fill: none;
          stroke-dasharray: 500; stroke-dashoffset: 500;
          animation: hpDrawThread 1.2s 0.6s cubic-bezier(.77,0,.175,1) forwards;
        }
        .hp-thread-wave {
          stroke: rgba(245,197,24,0.2); stroke-width: 1; fill: none;
          stroke-dasharray: 400; stroke-dashoffset: 400;
          animation: hpDrawThread 2s 0.5s ease forwards;
        }
        @keyframes hpDrawThread { to { stroke-dashoffset: 0; } }
        .hp-load-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3.2rem; letter-spacing: 0.25em; color: #f5f5f0;
          opacity: 0; animation: hpFadeUp 0.6s 0.8s forwards;
        }
        .hp-load-sub {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem; letter-spacing: 0.5em;
          color: #f5c518; text-transform: uppercase;
          opacity: 0; animation: hpFadeUp 0.6s 1.1s forwards;
        }
        .hp-load-bar-wrap {
          width: 200px; height: 2px;
          background: #353535; margin-top: 12px;
          overflow: hidden; border-radius: 2px;
        }
        .hp-load-bar {
          height: 100%; background: #f5c518;
          width: 0; animation: hpLoadFill 1.8s 0.3s ease forwards;
        }
        @keyframes hpLoadFill  { to { width: 100%; } }
        @keyframes hpFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
