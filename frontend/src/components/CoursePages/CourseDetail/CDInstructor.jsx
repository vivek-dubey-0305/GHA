export default function CDInstructor({ instructor }) {
  if (!instructor) {
    return (
      <div className="cd-instructor-bio cp-reveal">
        <p style={{ color: "#888" }}>Instructor information not available.</p>
      </div>
    );
  }

  const fullName =
    instructor.fullName ||
    `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim();

  return (
    <div className="cd-instructor-bio cp-reveal">
      <div className="cd-instructor-avatar-lg">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#1a1a1a" />
          <circle cx="50" cy="38" r="22" fill="#f5c518" opacity="0.8" />
          <ellipse cx="50" cy="95" rx="36" ry="26" fill="#f5c518" opacity="0.5" />
        </svg>
      </div>

      <div>
        <div className="cd-instructor-name-lg">{fullName.toUpperCase()}</div>
        <div className="cd-instructor-title-sm">
          {instructor.headline || instructor.expertise?.join(" · ") || "Expert Instructor"}
        </div>

        <div className="cd-instructor-stats-row">
          <div className="cd-inst-stat">
            ⭐ <em>{instructor.rating?.averageRating || "4.9"}</em> avg rating
          </div>
          <div className="cd-inst-stat">
            👥 <em>{(instructor.totalStudents || 0).toLocaleString()}</em> students
          </div>
          <div className="cd-inst-stat">
            📚 <em>{instructor.courses?.length || 0}</em> courses
          </div>
        </div>

        <div className="cd-instructor-bio-text">
          {instructor.bio ||
            `${fullName} is an expert instructor with years of industry experience. Their courses are known for practical, production-ready content that translates directly to real-world applications.`}
        </div>
      </div>
    </div>
  );
}
