import { useRef } from "react";
import { useParams } from "react-router-dom";

import "../../components/CoursePages/course-pages.css";
import "../../components/CoursePages/CourseDetail/course-detail.css";

import useCPCursor    from "../../components/CoursePages/useCPCursor";
import useCPParticles from "../../components/CoursePages/useCPParticles";
import useCPReveal    from "../../components/CoursePages/useCPReveal";

import CDScrollProgress  from "../../components/CoursePages/CourseDetail/CDScrollProgress";
import CDNavbar          from "../../components/CoursePages/CourseDetail/CDNavbar";
import CDHero            from "../../components/CoursePages/CourseDetail/CDHero";
import CDCertBanner      from "../../components/CoursePages/CourseDetail/CDCertBanner";
import CDTabs            from "../../components/CoursePages/CourseDetail/CDTabs";
import CDRelatedCourses  from "../../components/CoursePages/CourseDetail/CDRelatedCourses";
import CDStickyEnroll    from "../../components/CoursePages/CourseDetail/CDStickyEnroll";
import CDFooter          from "../../components/CoursePages/CourseDetail/CDFooter";

import {
  getCourseById,
  getModulesByCourse,
  getRelatedCourses,
  getInstructorById,
} from "../../mock/course";

export default function CourseDetail() {
  const { id } = useParams();

  // Hooks
  const { dotRef, ringRef } = useCPCursor();
  const canvasRef = useCPParticles();
  useCPReveal();

  // Enroll card ref for scroll-to
  const enrollCardRef = useRef(null);

  // Data
  const course     = getCourseById(id) || getCourseById("course_006"); // fallback
  const modules    = course ? getModulesByCourse(course._id) : [];
  const related    = course ? getRelatedCourses(course._id) : [];
  const instructor = course ? getInstructorById(
    typeof course.instructor === "string" ? course.instructor : "inst_003"
  ) : null;

  // Scroll to enroll card
  const handleEnroll = () => {
    if (enrollCardRef.current) {
      enrollCardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      enrollCardRef.current.style.border = "1px solid #f5c518";
      enrollCardRef.current.style.boxShadow = "0 0 40px rgba(245,197,24,0.15)";
      setTimeout(() => {
        if (enrollCardRef.current) {
          enrollCardRef.current.style.boxShadow = "";
        }
      }, 2000);
    }
  };

  if (!course) {
    return (
      <div style={{ background: "#0a0a0a", color: "#f4f3ee", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem" }}>
        COURSE NOT FOUND
      </div>
    );
  }

  return (
    <div className="cd-page">
      {/* Fixed overlays */}
      <div className="cp-cursor"      ref={dotRef} />
      <div className="cp-cursor-ring" ref={ringRef} />
      <div className="cp-noise" />
      <canvas className="cp-canvas" ref={canvasRef} />

      {/* Scroll progress bar */}
      <CDScrollProgress />

      {/* Navbar */}
      <CDNavbar onEnroll={handleEnroll} />

      {/* Hero + floating card */}
      <CDHero course={course} cardRef={enrollCardRef} />

      {/* Certificate banner */}
      <CDCertBanner />

      {/* Tabs: Overview / Curriculum / Instructor / Reviews */}
      <CDTabs
        course={course}
        modules={modules}
        instructor={instructor}
      />

      {/* Related courses */}
      <CDRelatedCourses courses={related} />

      {/* Sticky bottom enroll bar */}
      <CDStickyEnroll course={course} onEnroll={handleEnroll} />

      {/* Footer */}
      <CDFooter />
    </div>
  );
}
