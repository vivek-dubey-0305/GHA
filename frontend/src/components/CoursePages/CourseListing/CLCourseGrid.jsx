import CLCourseCard from "./CLCourseCard";

export default function CLCourseGrid({ courses, viewMode }) {
  if (courses.length === 0) {
    return (
      <div className={`cl-course-grid${viewMode === "list" ? " list-view" : ""}`}>
        <div className="cl-no-results">
          No courses found. <span>Try adjusting filters.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`cl-course-grid${viewMode === "list" ? " list-view" : ""}`}>
      {courses.map((course, i) => (
        <CLCourseCard
          key={course._id || course.id}
          course={course}
          viewMode={viewMode}
          index={i}
        />
      ))}
    </div>
  );
}
