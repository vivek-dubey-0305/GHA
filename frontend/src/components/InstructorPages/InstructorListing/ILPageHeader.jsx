import BgAnimationWrapper from "../../animations/BgAnimationWrapper";

export default function ILPageHeader() {
  return (
    <div className="il-hero">
      {/* Background Animation */}
      <BgAnimationWrapper
        bgText="INSTRUCTORS"
        accentColor="#f5c518"
        svgSize="50%"
        showGrid={false}
        svgOpacity={0.08}
      />

      {/* Hero Content */}
      <div className="il-hero-inner ip-reveal">
        <div className="il-hero-content">
          <div className="il-hero-tag">Meet the Experts</div>
          <div className="il-hero-title">
            LEARN FROM<br /><em>WORLD-CLASS</em><br />INSTRUCTORS
          </div>
          <div className="il-hero-sub">
            Industry veterans, researchers, and builders who've done it at scale.
            No generic tutors — only practitioners from the world's best companies.
          </div>
        </div>
        <div className="il-hero-stats-grid">
          <div className="il-hero-stat">
            <div className="il-hs-num">48</div>
            <div className="il-hs-label">Instructors</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">4.87</div>
            <div className="il-hs-label">Avg Rating</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">320+</div>
            <div className="il-hs-label">Total Courses</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">480K</div>
            <div className="il-hs-label">Students Taught</div>
          </div>
        </div>
      </div>
    </div>
  );
}
