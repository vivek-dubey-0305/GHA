import InstructorEmptyState from "../InstructorEmptyState";
import DynamicLucideIcon from "../DynamicLucideIcon";

export default function IDAbout({ instructor }) {
  if (!instructor) return null;

  const specializations = instructor.specializations || [];
  const qualifications = instructor.qualifications || [];
  const timeline = instructor.timeline || [];

  return (
    <>
      {/* BIO */}
      <div className="id-sec-tag ip-reveal">Biography</div>
      <div className="id-sec-title ip-reveal">THE STORY BEHIND<br/>THE INSTRUCTOR</div>
      <div className="id-bio-block ip-reveal">
        <div className="id-bio-text">
          {(instructor.fullBio || instructor.bio).split("\n").filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {/* SPECIALIZATIONS */}
      <div className="id-sec-tag ip-reveal">Expertise</div>
      <div className="id-sec-title ip-reveal">SPECIALIZATIONS</div>
      <div className="id-spec-grid ip-reveal">
        {specializations.length === 0 ? (
          <InstructorEmptyState
            title="No Specializations Listed"
            description="Specialization details will appear here once updated."
            compact
          />
        ) : specializations.map((s, i) => (
          <div className="id-spec-card" key={i}>
            <div className="id-spec-card-icon">
              <DynamicLucideIcon name={s.icon} size={24} />
            </div>
            <div className="id-spec-card-title">{s.title}</div>
            <div className="id-spec-card-desc">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* QUALIFICATIONS */}
      <div className="id-sec-tag ip-reveal">Education</div>
      <div className="id-sec-title ip-reveal">QUALIFICATIONS</div>
      <div className="id-qual-grid ip-reveal">
        {qualifications.length === 0 ? (
          <InstructorEmptyState
            title="No Qualifications Added"
            description="Qualification and certification entries are currently unavailable."
            compact
          />
        ) : qualifications.map((q, i) => (
          <div className="id-qual-item" key={i}>
            <div className="id-qual-accent"/>
            <div className="id-qual-icon">
              <DynamicLucideIcon name={q.icon} size={22} />
            </div>
            <div className="id-qual-year">{q.year}</div>
            <div className="id-qual-title">{q.title}</div>
            <div className="id-qual-inst">{q.inst}</div>
          </div>
        ))}
      </div>

      {/* TIMELINE */}
      <div className="id-sec-tag ip-reveal">Career Timeline</div>
      <div className="id-sec-title ip-reveal">PROFESSIONAL EXPERIENCE</div>
      <div className="id-timeline ip-reveal">
        {timeline.length === 0 ? (
          <InstructorEmptyState
            title="No Experience Timeline"
            description="Professional timeline data has not been provided yet."
            compact
          />
        ) : timeline.map((t, i) => (
          <div className="id-tl-item" key={i}>
            <div className="id-tl-dot"/>
            <div className="id-tl-year">{t.year}</div>
            <div className="id-tl-company">{t.company}</div>
            <div className="id-tl-role">{t.role}</div>
            <div className="id-tl-desc">{t.desc}</div>
            <div className="id-tl-tags">
              {(t.tags || []).map((tag) => <span key={tag} className="id-tl-tag">{tag}</span>)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
