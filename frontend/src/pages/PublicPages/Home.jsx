import "../../components/HomePage/home-pages.css";


import useHPCursor from "../../components/HomePage/useHPCursor";
import useHPParticles from "../../components/HomePage/useHPParticles";
import useHPReveal    from "../../components/HomePage/useHPReveal";

import HPLoader           from "../../components/HomePage/HPLoader";
import GlobalNavbar       from "../../components/GlobalNavbar";
import HPHero             from "../../components/HomePage/HPHero";
import HPMarquee          from "../../components/HomePage/HPMarquee";
import HPEditorsPick      from "../../components/HomePage/HPEditorsPick";
import HPCourseCategories from "../../components/HomePage/HPCourseCategories";
import HPWhyChooseUs      from "../../components/HomePage/HPWhyChooseUs";
import HPInstructors      from "../../components/HomePage/HPInstructors";
import HPTestimonials     from "../../components/HomePage/HPTestimonials";
import HPCta              from "../../components/HomePage/HPCta";
import HPFooter           from "../../components/HomePage/HPFooter";

export default function Home() {
  const { dotRef, ringRef } = useHPCursor();
  const canvasRef = useHPParticles();
  useHPReveal();

  return (
    <div className="hp-page">
      {/* Fixed overlays */}
      <div className="hp-cursor"      ref={dotRef} />
      <div className="hp-cursor-ring" ref={ringRef} />
      <div className="hp-noise" />
      <canvas className="hp-canvas" ref={canvasRef} />

      {/* Preloader — shows on every visit */}
      <HPLoader />

      {/* Navigation */}
      <GlobalNavbar />

      {/* ── SECTION 1: Hero ── */}
      <HPHero />

      {/* ── Marquee ticker ── */}
      <HPMarquee />

      {/* ── SECTION 2: Editor's Pick + Course Grid ── */}
      <HPEditorsPick />

      {/* ── SECTION 3: Course Categories ── */}
      <HPCourseCategories />

      {/* ── SECTION 4: Why Choose GHA (7 tabs, 42 items) ── */}
      <HPWhyChooseUs />

      {/* ── SECTION 5: Instructors ── */}
      <HPInstructors />

      {/* ── SECTION 6: Testimonials ── */}
      <HPTestimonials />

      {/* ── SECTION 7: CTA ── */}
      <HPCta />

      {/* ── Footer ── */}
      <HPFooter />
    </div>
  );
}
