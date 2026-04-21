import { useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import "../../components/InstructorPages/instructor-pages.css";
import "../../components/InstructorPages/InstructorDetail/instructor-detail.css";

import useIPCursor    from "../../components/InstructorPages/useIPCursor";
import useIPParticles from "../../components/InstructorPages/useIPParticles";
import useIPReveal    from "../../components/InstructorPages/useIPReveal";

import IDScrollProgress from "../../components/InstructorPages/InstructorDetail/IDScrollProgress";
import IDNavbar         from "../../components/InstructorPages/InstructorDetail/IDNavbar";
import IDHero           from "../../components/InstructorPages/InstructorDetail/IDHero";
import IDStatsStrip     from "../../components/InstructorPages/InstructorDetail/IDStatsStrip";
import IDTabs           from "../../components/InstructorPages/InstructorDetail/IDTabs";
import IDRightSidebar   from "../../components/InstructorPages/InstructorDetail/IDRightSidebar";
import IDCtaBottom      from "../../components/InstructorPages/InstructorDetail/IDCtaBottom";
import IDFooter         from "../../components/InstructorPages/InstructorDetail/IDFooter";
import InstructorEmptyState from "../../components/InstructorPages/InstructorEmptyState";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";

import {
  getInstructorById,
  getInstructorReviews,
} from "../../redux/slices/instructor.slice.js";

const toTitle = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const resolveImage = (profilePicture) => {
  if (typeof profilePicture === "string") return profilePicture;
  return profilePicture?.secure_url || "https://ui-avatars.com/api/?name=Instructor&background=0a0a0a&color=f5c518";
};

const formatYearRange = (startYear, endYear, ongoing) => {
  if (startYear && (endYear || ongoing)) {
    return `${startYear} - ${ongoing ? "Present" : endYear}`;
  }
  if (startYear) return String(startYear);
  if (endYear) return String(endYear);
  return "Timeline unavailable";
};

const formatReviewDate = (dateValue) => {
  if (!dateValue) return "Recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const mapInstructorDetailForUI = (rawInstructor, reviews = [], ratingStats = null) => {
  if (!rawInstructor) return null;

  const firstName = rawInstructor?.profile?.firstName || rawInstructor?.firstName || "Instructor";
  const lastName = rawInstructor?.profile?.lastName || rawInstructor?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const specializations = rawInstructor?.professional?.specializations || [];
  const qualifications = rawInstructor?.professional?.qualifications || [];
  const workExperience = rawInstructor?.professional?.workExperience || [];
  const skills = rawInstructor?.professional?.skills || [];
  const achievements = rawInstructor?.professional?.achievements || [];
  const publishedCourses = rawInstructor?.publishedCourses || [];
  const social = rawInstructor?.social || {};

  const mappedCourses = publishedCourses.map((course, index) => {
    const ratingValue = typeof course?.rating === "number" ? course.rating : Number(course?.rating?.averageRating || 0);
    const reviewsCount = Number(course?.rating?.totalReviews || 0);
    const badges = [];
    if (ratingValue >= 4.8) badges.push({ cls: "badge-best", label: "Best Seller" });
    if (index < 2) badges.push({ cls: "badge-new", label: "Popular" });

    return {
      id: course?._id,
      img: course?.thumbnail?.secure_url || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80",
      level: toTitle(course?.level || "all levels"),
      badges,
      cat: toTitle(course?.category || "General"),
      sub: "Masterclass",
      title: course?.title || "Untitled Course",
      hours: Number(course?.durationHours || 0),
      projects: Number(course?.projectsCount || 0),
      internship: false,
      rating: Number(ratingValue.toFixed(1)),
      reviews: reviewsCount,
      students: Number(course?.totalEnrollments || 0),
      price: Number(course?.price || 0),
      oldPrice: null,
    };
  });

  const mappedReviews = (reviews || []).map((review) => ({
    name: `${review?.user?.firstName || "Learner"} ${review?.user?.lastName || ""}`.trim(),
    course: review?.course?.title || "Course",
    date: formatReviewDate(review?.createdAt),
    stars: Number(review?.rating || 0),
    text: review?.description || review?.title || "Great learning experience.",
  }));

  const socialLinks = [
    { key: "linkedin", label: "LinkedIn", icon: "💼" },
    { key: "github", label: "GitHub", icon: "🐙" },
    { key: "twitter", label: "Twitter", icon: "🐦" },
    { key: "website", label: "Website", icon: "🌐" },
    { key: "youtube", label: "YouTube", icon: "▶" },
  ]
    .filter((item) => social?.[item.key])
    .map((item) => ({ label: item.label, icon: item.icon, url: social[item.key] }));

  const badges = [];
  if (rawInstructor?.badges?.isTopInstructor) badges.push("top");
  if (rawInstructor?.badges?.isVerifiedExpert) badges.push("verified");
  if (rawInstructor?.badges?.availableForMentorship || rawInstructor?.badges?.availableForLive) badges.push("mentor");

  return {
    id: rawInstructor?._id,
    name: fullName,
    title: rawInstructor?.profile?.professionalTitle || rawInstructor?.professionalTitle || "Professional Instructor",
    specs: specializations.map((item) => item?.area).filter(Boolean),
    bio: rawInstructor?.about?.shortBio || rawInstructor?.shortBio || "Instructor profile is being updated.",
    fullBio: rawInstructor?.about?.bio || rawInstructor?.bio || rawInstructor?.about?.shortBio || "No detailed biography available yet.",
    rating: Number((ratingStats?.averageRating || rawInstructor?.stats?.averageRating || 0).toFixed(2)),
    reviews: Number(ratingStats?.totalReviews || rawInstructor?.stats?.totalReviews || 0),
    students: Number(rawInstructor?.stats?.totalStudentsTeaching || rawInstructor?.totalStudentsTeaching || 0),
    courses: Number(rawInstructor?.stats?.totalCourses || rawInstructor?.totalCourses || mappedCourses.length),
    exp: Number(rawInstructor?.professional?.yearsOfExperience || rawInstructor?.yearsOfExperience || 0),
    liveClasses: Number(rawInstructor?.totalLiveClasses || 0),
    img: resolveImage(rawInstructor?.profile?.profilePicture || rawInstructor?.profilePicture),
    bannerColor: rawInstructor?.profile?.bannerColor || rawInstructor?.bannerColor || "#111111",
    badges,
    specializations: specializations.map((item) => ({
      icon: item?.icon || "Sparkles",
      title: String(item?.area || "Specialization").toUpperCase(),
      desc: item?.description || "Domain expertise and practical mentoring.",
    })),
    qualifications: qualifications.map((item) => ({
      icon: item?.icon || "GraduationCap",
      year: formatYearRange(item?.startYear, item?.endYear, item?.isOngoing),
      title: item?.title || "Qualification",
      inst: item?.institution || "Institution",
    })),
    timeline: workExperience.map((item) => ({
      year: formatYearRange(item?.startYear, item?.endYear, item?.isCurrent),
      company: item?.company || "Company",
      role: item?.role || "Role",
      desc: item?.description || "Hands-on professional experience.",
      tags: item?.techStack || [],
    })),
    myCourses: mappedCourses,
    achievements: achievements.map((item) => ({
      icon: item?.icon || "Trophy",
      title: item?.title || "Achievement",
      sub: item?.year ? `${item.year} · ${toTitle(item?.category || "")}` : toTitle(item?.category || "") || "Milestone",
    })),
    skills: skills
      .slice()
      .sort((a, b) => Number(b?.proficiency || 0) - Number(a?.proficiency || 0))
      .map((item) => ({
        name: item?.name || "Skill",
        pct: Number(item?.proficiency || 0),
      })),
    social: socialLinks,
    reviewItems: mappedReviews,
    ratingBreakdown: ratingStats?.ratingBreakdown || rawInstructor?.stats?.ratingBreakdown || null,
  };
};

export default function InstructorDetail() {
  const dispatch = useDispatch();
  const { id } = useParams();

  const {
    currentInstructor,
    reviews,
    ratingStats,
    loadingInstructorDetail,
    loadingReviews,
    detailError,
    reviewsError,
  } = useSelector((state) => state.instructor);

  const { dotRef, ringRef } = useIPCursor();
  const canvasRef = useIPParticles();
  useIPReveal();

  useEffect(() => {
    if (!id) return;
    dispatch(getInstructorById(id));
    dispatch(getInstructorReviews({ instructorId: id, page: 1, limit: 10 }));
  }, [dispatch, id]);

  const instructor = useMemo(
    () => mapInstructorDetailForUI(currentInstructor, reviews, ratingStats),
    [currentInstructor, reviews, ratingStats]
  );

  if (loadingInstructorDetail && !instructor) {
    return (
      <div className="id-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <SearchPulseLoader
          label="Loading instructor profile"
          sublabel="Preparing expertise, courses, and reviews"
          className="max-w-md"
        />
      </div>
    );
  }

  if (detailError || !instructor) {
    return (
      <div className="id-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <InstructorEmptyState
          title="Instructor Not Found"
          description={detailError || "This instructor profile is unavailable right now."}
        />
      </div>
    );
  }

  return (
    <div className="id-page">
      {/* Fixed overlays */}
      <div className="ip-cursor"      ref={dotRef} />
      <div className="ip-cursor-ring" ref={ringRef} />
      <div className="ip-noise" />
      <canvas className="ip-canvas" ref={canvasRef} />

      {/* Scroll progress */}
      <IDScrollProgress />

      {/* Navbar */}
      <IDNavbar />

      {/* Hero banner + avatar + info + quick card */}
      <IDHero instructor={instructor} />

      {/* Animated counter stats strip */}
      <IDStatsStrip instructor={instructor} />

      {/* Body: tabs on left, sidebar on right */}
      <div className="id-body-wrap">
        <div className="id-body-left">
          <IDTabs
            instructor={instructor}
            reviews={reviews}
            ratingStats={ratingStats}
            loadingReviews={loadingReviews}
            reviewsError={reviewsError}
          />
        </div>
        <IDRightSidebar instructor={instructor} />
      </div>

      {/* Yellow CTA bottom */}
      <IDCtaBottom instructor={instructor} />

      {/* Footer */}
      <IDFooter />
    </div>
  );
}
