import { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

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
  getRelatedCourses as getRelatedCoursesAction,
  getCourseReviews,
} from "../../redux/slices/course.slice.js";

export default function CourseDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Hooks
  const { dotRef, ringRef } = useCPCursor();
  const canvasRef = useCPParticles();
  useCPReveal();

  // Redux state
  const {
    currentCourse: course,
    modules,
    currentInstructor: instructor,
    relatedCourses: related,
    reviews,
    ratingStats,
    loadingReviews,
    loadingCourseDetail,
    courseDetailError,
  } = useSelector((state) => state.course);

  // Enroll card ref for scroll-to
  const enrollCardRef = useRef(null);

  // Fetch course details on mount or when id changes
  useEffect(() => {
    if (id) {
      console.log("== COURSE DETAIL PAGE LOAD ==");
      console.log("-- route courseId:", id);
      console.log("** dispatching getCourseById + getCourseReviews #3 **");
      console.log("===============================");
      dispatch(getCourseById(id));
      dispatch(getCourseReviews({ courseId: id, page: 1, limit: 10 }));
    }

    return () => {
      // Optional: Cleanup on unmount
      // dispatch(clearCurrentCourse());
    };
  }, [id, dispatch]);

  // Fetch related courses when course category is available
  useEffect(() => {
    if (course && course.category) {
      console.log("== RELATED COURSES DEBUG ==");
      console.log("-- courseId:", id, "| category:", course.category);
      console.log("===============================");
      dispatch(getRelatedCoursesAction({
        courseId: id,
        category: course.category,
        limit: 6,
      }));
    }
  }, [course, dispatch, id]);

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

  if (loadingCourseDetail) {
    return (
      <div style={{ background: "#0a0a0a", color: "#f4f3ee", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem" }}>
        Loading course details...
      </div>
    );
  }

  if (courseDetailError || !course) {
    return (
      <div style={{ background: "#0a0a0a", color: "#f4f3ee", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem" }}>
        {courseDetailError || "COURSE NOT FOUND"}
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
        reviews={reviews}
        ratingStats={ratingStats}
        loadingReviews={loadingReviews}
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
