// CourseDetail.jsx
import { useRef, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
import SearchPulseLoader from "../../components/common/SearchPulseLoader";

import {
  getCourseById,
  getRelatedCourses as getRelatedCoursesAction,
  getCourseReviews,
} from "../../redux/slices/course.slice.js";
import { checkEnrollment, getMyEnrollments } from "../../redux/slices/enrollment.slice.js";
import {
  initiatePayment,
  launchRazorpayCheckout,
  getLatestPaymentForCourse,
} from "../../redux/slices/payment.slice.js";

export default function CourseDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isEnrollActionRunning, setIsEnrollActionRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [openReviewComposerToken, setOpenReviewComposerToken] = useState(0);
  const [pendingReviewScroll, setPendingReviewScroll] = useState(false);
  const [pendingComposeAfterScroll, setPendingComposeAfterScroll] = useState(false);

  const scrollToReviewsSection = () => {
    window.requestAnimationFrame(() => {
      const reviewsAnchor = document.getElementById("cd-reviews-anchor");
      reviewsAnchor?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { enrollmentByCourse, error: enrollmentError } = useSelector((state) => state.enrollment);
  const {
    checkoutLoading,
    paymentStatusByCourse,
    latestPaymentByCourse,
    error: paymentError,
  } = useSelector((state) => state.payment);

  const normalizedCourseId = String(id || "");
  const isEnrolled = Boolean(enrollmentByCourse[normalizedCourseId]);
  const paymentStatus =
    paymentStatusByCourse[normalizedCourseId] || latestPaymentByCourse[normalizedCourseId]?.status || "none";
  const isPaymentPending = ["pending", "processing", "checking"].includes(paymentStatus);
  const enrollDisabled = !isEnrolled && (isPaymentPending || checkoutLoading || isEnrollActionRunning);

  const enrollLabel = useMemo(() => {
    if (isEnrolled) return "Continue Learning";
    if (enrollDisabled) return "Processing Enrollment...";
    return "Enroll Now — Get Instant Access";
  }, [enrollDisabled, isEnrolled]);

  const navbarCtaLabel = useMemo(() => {
    if (isEnrolled) return "Continue Learning";
    if (enrollDisabled) return "Processing...";
    return "Enroll Now";
  }, [enrollDisabled, isEnrolled]);

  const stickyCtaLabel = useMemo(() => {
    if (isEnrolled) return "Continue Learning";
    if (enrollDisabled) return "Processing...";
    return `Enroll for $${course?.discountPrice || course?.price || 0} →`;
  }, [course?.discountPrice, course?.price, enrollDisabled, isEnrolled]);

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

  useEffect(() => {
    const requestedTab = String(searchParams.get("tab") || "").toLowerCase();
    const shouldCompose = searchParams.get("composeReview") === "1";

    if (requestedTab === "reviews") {
      setPendingReviewScroll(true);
      setPendingComposeAfterScroll(shouldCompose);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!pendingReviewScroll) return;
    if (loadingCourseDetail || !course?._id) return;

    // Wait for detail layout to settle before smooth scrolling.
    const timer = window.setTimeout(() => {
      scrollToReviewsSection();

      // Activate reviews after scroll begins to keep transition smoother.
      window.setTimeout(() => {
        setActiveTab("reviews");

        if (pendingComposeAfterScroll) {
          setOpenReviewComposerToken(Date.now());

          const next = new URLSearchParams(searchParams);
          next.delete("composeReview");
          setSearchParams(next, { replace: true });
        }

        setPendingComposeAfterScroll(false);
        setPendingReviewScroll(false);
      }, 260);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [
    pendingReviewScroll,
    pendingComposeAfterScroll,
    loadingCourseDetail,
    course?._id,
    searchParams,
    setSearchParams,
  ]);

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

  useEffect(() => {
    if (!normalizedCourseId || !isAuthenticated) return;
    dispatch(checkEnrollment(normalizedCourseId));
    dispatch(getLatestPaymentForCourse(normalizedCourseId));
  }, [dispatch, isAuthenticated, normalizedCourseId]);

  useEffect(() => {
    if (!normalizedCourseId || !isAuthenticated || isEnrolled) return;
    if (!["pending", "processing"].includes(paymentStatus)) return;

    console.info("[enrollment-flow] ⏳ Polling payment + enrollment status", {
      courseId: normalizedCourseId,
      paymentStatus,
    });

    const timer = setInterval(() => {
      dispatch(getLatestPaymentForCourse(normalizedCourseId));
      dispatch(checkEnrollment(normalizedCourseId));
    }, 5000);

    return () => clearInterval(timer);
  }, [dispatch, isAuthenticated, isEnrolled, normalizedCourseId, paymentStatus]);

  useEffect(() => {
    if (!isAuthenticated || !isEnrolled) return;
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch, isAuthenticated, isEnrolled]);

  const handleEnroll = async () => {
    if (!course || !normalizedCourseId) return;

    if (isEnrolled) {
      console.info("[enrollment-flow] ✅ Already enrolled, redirecting to dashboard", {
        courseId: normalizedCourseId,
      });
      navigate("/dashboard");
      return;
    }

    if (!isAuthenticated) {
      console.info("[enrollment-flow] 🔐 User not authenticated, redirecting to login", {
        courseId: normalizedCourseId,
      });
      navigate("/login");
      return;
    }

    if (enrollDisabled) {
      console.info("[enrollment-flow] ⛔ Enrollment action blocked while processing", {
        courseId: normalizedCourseId,
        paymentStatus,
      });
      return;
    }

    setIsEnrollActionRunning(true);

    try {
      console.info("[enrollment-flow] 🚀 Initiating payment", {
        courseId: normalizedCourseId,
      });

      const initPayload = await dispatch(
        initiatePayment({ courseId: normalizedCourseId, paymentMethod: "razorpay" })
      ).unwrap();

      const initData = initPayload?.data || {};
      const payment = initData?.payment;
      const checkout = initData?.checkout;

      if (initData?.isFreeEnrollment) {
        console.info("[enrollment-flow] 🎉 Free enrollment completed instantly", {
          courseId: normalizedCourseId,
        });
        await dispatch(checkEnrollment(normalizedCourseId));
        await dispatch(getMyEnrollments({ page: 1, limit: 100 }));
        navigate("/dashboard");
        return;
      }

      if (!payment || !checkout) {
        throw new Error("Payment checkout data missing from backend response");
      }

      console.info("[enrollment-flow] 💳 Launching Razorpay checkout", {
        paymentId: payment?._id,
        courseId: normalizedCourseId,
      });

      const verifyPayload = await dispatch(
        launchRazorpayCheckout({
          payment,
          checkout,
          prefill: {
            name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
            email: user?.email || "",
            contact: user?.phone || "",
          },
        })
      ).unwrap();

      const verifyStatus = verifyPayload?.data?.payment?.status;
      console.info("[enrollment-flow] 🔐 Payment verification callback received", {
        paymentId: payment?._id,
        status: verifyStatus,
      });

      await dispatch(getLatestPaymentForCourse(normalizedCourseId));
      await dispatch(checkEnrollment(normalizedCourseId));

      if (verifyStatus === "completed") {
        await dispatch(getMyEnrollments({ page: 1, limit: 100 }));
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("[enrollment-flow] ❌ Enrollment/payment flow failed", {
        courseId: normalizedCourseId,
        message: error?.message || String(error),
      });
    } finally {
      setIsEnrollActionRunning(false);
    }
  };

  const handleOpenReviewFlow = () => {
    setActiveTab("reviews");
    setOpenReviewComposerToken(Date.now());
  };

  if (loadingCourseDetail) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <SearchPulseLoader
          label="Loading course details"
          sublabel="Preparing syllabus, reviews, and enrollment data"
          className="max-w-md"
        />
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
      <CDNavbar onEnroll={handleEnroll} enrollLabel={navbarCtaLabel} enrollDisabled={enrollDisabled} />

      {/* Hero + floating card */}
      <CDHero
        course={course}
        cardRef={enrollCardRef}
        onEnroll={handleEnroll}
        onOpenReviewFlow={handleOpenReviewFlow}
        enrollLabel={enrollLabel}
        enrollDisabled={enrollDisabled}
      />

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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openReviewComposerToken={openReviewComposerToken}
      />

      {/* Related courses */}
      <CDRelatedCourses courses={related} />

      {/* Sticky bottom enroll bar */}
      <CDStickyEnroll
        course={course}
        onEnroll={handleEnroll}
        enrollLabel={stickyCtaLabel}
        enrollDisabled={enrollDisabled}
      />

      {(paymentError || enrollmentError) && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "20px",
            maxWidth: "420px",
            background: "rgba(255, 80, 80, 0.15)",
            border: "1px solid rgba(255, 80, 80, 0.5)",
            color: "#ffb4b4",
            padding: "10px 14px",
            zIndex: 999,
            borderRadius: "8px",
            fontSize: "0.78rem",
          }}
        >
          ⚠ {(paymentError || enrollmentError)}
        </div>
      )}

      {/* Footer */}
      <CDFooter />
    </div>
  );
}
