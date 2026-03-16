import { useNavigate } from "react-router-dom";

export default function CDRelatedCourses({ courses }) {
  const navigate = useNavigate();
  if (!courses || courses.length === 0) return null;

  return (
    <section className="cd-related-section">
      <div className="cd-related-heading">
        MORE <span>COURSES</span>
      </div>
      <div className="cd-related-grid">
        {courses.slice(0, 3).map((c) => (
          <div
            key={c._id}
            className="cd-related-card"
            onClick={() => {
              navigate(`/courses/${c._id}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div className="cd-related-cat">{c.category}</div>
            <div className="cd-related-title">{c.title}</div>
            <div className="cd-related-price">
              ${c.discountPrice || c.price}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
