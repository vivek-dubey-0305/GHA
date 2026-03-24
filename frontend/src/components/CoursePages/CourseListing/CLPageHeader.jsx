import BgAnimationWrapper from "../../animations/BgAnimationWrapper";

const compactLearners = (value) => {
  const num = Number(value || 0);
  if (num <= 0) return "0+";
  if (num >= 1000000) return `${Math.round((num / 1000000) * 10) / 10}M+`;
  return `${Math.round((num / 1000) * 10) / 10}K+`;
};

export default function CLPageHeader({
  totalCourses = 0,
  totalCategories = 0,
  totalStudents = 0,
  totalInternships = 0,
}) {
  return (
    <div className="cl-page-header">
      {/* Background Animation */}
      <BgAnimationWrapper
        bgText="COURSES"
        accentColor="#f5c518"
        svgSize="48%"
        showGrid={false}
        svgOpacity={0.08}
      />

      {/* Hero Content */}
      <div className="cl-ph-inner">
        <div className="cl-ph-content">
          <div className="cl-ph-tag">Knowledge Arsenal</div>
          <div className="cl-ph-title">
            ALL <em>COURSES</em><br />& PROGRAMS
          </div>
          <p className="cl-ph-sub">
            Production-grade skills from practitioners. No fluff, no filler —
            just the exact knowledge top teams use to ship.
          </p>
        </div>
        <div className="cl-ph-stats">
          <div className="cl-ph-stat">
            <span className="cl-ph-stat-num">{Number(totalCourses || 0)}+</span>
            <span className="cl-ph-stat-label">courses</span>
          </div>
          <div className="cl-ph-stat">
            <span className="cl-ph-stat-num">{Number(totalCategories || 0)}</span>
            <span className="cl-ph-stat-label">categories</span>
          </div>
          <div className="cl-ph-stat">
            <span className="cl-ph-stat-num">{compactLearners(totalStudents)}</span>
            <span className="cl-ph-stat-label">learners</span>
          </div>
          <div className="cl-ph-stat">
            <span className="cl-ph-stat-num">{Number(totalInternships || 0)}+</span>
            <span className="cl-ph-stat-label">internships</span>
          </div>
        </div>
      </div>
    </div>
  );
}
