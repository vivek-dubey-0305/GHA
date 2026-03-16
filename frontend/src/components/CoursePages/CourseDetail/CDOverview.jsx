export default function CDOverview({ course }) {
  if (!course) return null;

  return (
    <div className="cd-overview-grid">
      {/* Left column */}
      <div>
        <div className="cd-sub-heading cp-reveal">WHAT YOU'LL LEARN</div>
        <div className="cd-what-learn-list cp-reveal">
          {(course.learningOutcomes || []).map((item, i) => (
            <div key={i} className="cd-learn-item">
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div>
        <div className="cd-sub-heading cp-reveal">REQUIREMENTS</div>
        <ul className="cd-requirements-list cp-reveal">
          {(course.prerequisites || []).map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ul>

        <div className="cd-sub-heading cp-reveal" style={{ marginTop: 40 }}>
          WHO IS THIS FOR?
        </div>
        <ul className="cd-requirements-list cp-reveal">
          {(course.targetAudience || []).map((aud, i) => (
            <li key={i}>{aud}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
