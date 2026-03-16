import { useParams } from "react-router-dom";

import "../../components/InstructorPages/instructor-pages.css";
import "../../components/InstructorPages/InstructorDetail/instructor-detail.css";

import useIPCursor    from "../../components/InstructorPages/useIPCursor";
import useIPParticles from "../../components/InstructorPages/useIPParticles";
import useIPReveal    from "../../components/InstructorPages/useIPReveal";

import IDScrollProgress from "../../components/InstructorPages/InstructorDetail/IDScrollProgress";
import IDNavbar         from "../../components/InstructorPages/InstructorDetail/IDNavbar";
import IDHero           from "../../components/InstructorPages/InstructorDetail/IDHero";
import IDStatsStrip     from "../../components/InstructorPages/InstructorDetail/IDStatsStrip";
import IDTabs           from "../../components/InstructorPages/InstructorDetail/IDTabs";
import IDRightSidebar   from "../../components/InstructorPages/InstructorDetail/IDRightSidebar";
import IDCtaBottom      from "../../components/InstructorPages/InstructorDetail/IDCtaBottom";
import IDFooter         from "../../components/InstructorPages/InstructorDetail/IDFooter";

import { getInstructorById } from "../../mock/instructor";

export default function InstructorDetail() {
  const { id } = useParams();

  const { dotRef, ringRef } = useIPCursor();
  const canvasRef = useIPParticles();
  useIPReveal();

  // Fallback to instructor id=3 (James Wright) if not found
  const instructor = getInstructorById(id) || getInstructorById(3);

  if (!instructor) {
    return (
      <div style={{ background:"#0a0a0a", color:"#f4f3ee", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:"2rem" }}>
        INSTRUCTOR NOT FOUND
      </div>
    );
  }

  return (
    <div className="id-page">
      {/* Fixed overlays */}
      <div className="ip-cursor"      ref={dotRef} />
      <div className="ip-cursor-ring" ref={ringRef} />
      <div className="ip-noise" />
      <canvas className="ip-canvas" ref={canvasRef} />

      {/* Scroll progress */}
      <IDScrollProgress />

      {/* Navbar */}
      <IDNavbar />

      {/* Hero banner + avatar + info + quick card */}
      <IDHero instructor={instructor} />

      {/* Animated counter stats strip */}
      <IDStatsStrip instructor={instructor} />

      {/* Body: tabs on left, sidebar on right */}
      <div className="id-body-wrap">
        <div className="id-body-left">
          <IDTabs instructor={instructor} />
        </div>
        <IDRightSidebar instructor={instructor} />
      </div>

      {/* Yellow CTA bottom */}
      <IDCtaBottom instructor={instructor} />

      {/* Footer */}
      <IDFooter />
    </div>
  );
}
