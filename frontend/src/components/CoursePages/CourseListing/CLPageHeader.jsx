import BgAnimationWrapper from "../../animations/BgAnimationWrapper";

export default function CLPageHeader({ totalCourses, totalStudents, totalInstructors }) {
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
            <em>{totalCourses}+</em> COURSES
          </div>
          <div className="cl-ph-stat">
            <em>{Math.round(totalStudents / 1000)}K+</em> STUDENTS
          </div>
          <div className="cl-ph-stat">
            <em>{totalInstructors}+</em> INSTRUCTORS
          </div>
          <div className="cl-ph-stat">
            <em>4.8★</em> AVG RATING
          </div>
        </div>
      </div>
    </div>
  );
}
