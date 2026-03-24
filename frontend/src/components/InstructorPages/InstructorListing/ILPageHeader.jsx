import BgAnimationWrapper from "../../animations/BgAnimationWrapper";

const compactNumber = (value) => {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.round(num / 100) / 10}K`;
  return String(num);
};

export default function ILPageHeader({
  totalInstructors = 0,
  totalLiveSessions = 0,
  totalCourses = 0,
  totalStudents = 0,
}) {
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
            <div className="il-hs-num">{compactNumber(totalInstructors)}+</div>
            <div className="il-hs-label">instructors</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">{compactNumber(totalLiveSessions)}+</div>
            <div className="il-hs-label">live sessions</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">{compactNumber(totalCourses)}</div>
            <div className="il-hs-label">total courses</div>
          </div>
          <div className="il-hero-stat">
            <div className="il-hs-num">{compactNumber(totalStudents)}+</div>
            <div className="il-hs-label">learners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
