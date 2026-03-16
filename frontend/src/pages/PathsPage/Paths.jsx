import { useState } from "react";
import "../../components/PathsPage/paths-pages.css"

import usePPCursor    from "../../components/PathsPage/usePPCursor";
import usePPParticles from "../../components/PathsPage/usePPParticles";
import usePPReveal    from "../../components/PathsPage/usePPReveal";

import PPNavbar         from "../../components/PathsPage/PPNavbar";
import PPHero           from "../../components/PathsPage/PPHero";
import PPPathSelector   from "../../components/PathsPage/PPPathSelector";
import PPRoadmapViewer  from "../../components/PathsPage/PPRoadmapViewer";
import PPFooter         from "../../components/PathsPage/PPFooter";

export default function Paths() {
  const { dotRef, ringRef } = usePPCursor();
  const canvasRef = usePPParticles();
  usePPReveal();

  const [selectedPath, setSelectedPath] = useState("webdev");

  return (
    <div className="pp-page">
      {/* Fixed overlays */}
      <div className="pp-cursor"      ref={dotRef} />
      <div className="pp-cursor-ring" ref={ringRef} />
      <div className="pp-noise" />
      <div className="pp-scan" />
      <canvas className="pp-canvas" ref={canvasRef} />

      {/* Navigation */}
      <PPNavbar />

      {/* Hero */}
      <PPHero />

      {/* ── 8-card path selector ── */}
      <PPPathSelector selectedId={selectedPath} onSelect={setSelectedPath} />

      {/* ── Animated roadmap viewer ── */}
      <PPRoadmapViewer selectedId={selectedPath} />

      {/* Footer */}
      <PPFooter />
    </div>
  );
}
