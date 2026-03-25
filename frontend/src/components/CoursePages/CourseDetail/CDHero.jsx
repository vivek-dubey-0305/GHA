// CDHero.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VideoPlayer from "./VideoPlayer";

/* ── Countdown Timer Hook ── */
function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ── Enroll Card ── */
function EnrollCard({
  course,
  cardRef,
  onPreviewClick,
  hasPreview,
  onEnrollClick,
  enrollLabel,
  enrollDisabled,
}) {
  const timer = useCountdown(14 * 3600 + 32 * 60 + 7);
  const videoDurationLabel = Number(course?.totalDuration || 0) < 60
    ? `${Number(course?.totalDuration || 0)}m`
    : `${Math.round(((Number(course?.totalDuration || 0) / 60) * 10)) / 10}h`;
  const discountPct =
    course.price && course.discountPrice
      ? Math.round((1 - course.discountPrice / course.price) * 100)
      : 0;

  return (
    <div className="cd-detail-card" id="enrollCard" ref={cardRef}>
      {/* Preview SVG */}
      <div className="cd-card-preview">
        <svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="420" height="220" fill="#0f0f0f" />
          <defs>
            <radialGradient id="cg1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f5c518" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f5c518" stopOpacity="0" />
            </radialGradient>
            <pattern id="cgrid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#f5c518" strokeWidth="0.2" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="420" height="220" fill="url(#cgrid)" />
          <ellipse cx="210" cy="110" rx="160" ry="90" fill="url(#cg1)" />
          <g transform="translate(210,110)">
            <rect x="-60" y="-30" width="120" height="60" rx="4" fill="none" stroke="#f5c518" strokeWidth="1.5" opacity="0.8" />
            <text x="0" y="6" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" letterSpacing="1">
              {course.category?.toUpperCase() || "COURSE"}
            </text>
            <g opacity="0.6">
              <line x1="-60" y1="0" x2="-110" y2="-50">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </line>
              <circle cx="-110" cy="-50" r="10" fill="#f5c518" opacity="0.4" />
              <line x1="60" y1="0" x2="110" y2="-50">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
              </line>
              <circle cx="110" cy="-50" r="10" fill="#f5c518" opacity="0.4" />
              <line x1="0" y1="30" x2="0" y2="70">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
              </line>
              <circle cx="0" cy="70" r="10" fill="#f5c518" opacity="0.4" />
            </g>
          </g>
          <text x="210" y="195" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="28" fill="#f5c518" opacity="0.12" letterSpacing="5">
            PREVIEW
          </text>
        </svg>
        <div className="cd-card-preview-play" onClick={hasPreview ? onPreviewClick : undefined} style={{ cursor: hasPreview ? "pointer" : "not-allowed", opacity: hasPreview ? 1 : 0.65 }}>
          <div className="cd-play-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L16 10L7 16V4Z" fill="#f5c518" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="cd-card-body-detail">
        <div className="cd-card-price-row">
          <div className="cd-card-price-main">
            ${course.discountPrice || course.price}
          </div>
          {course.discountPrice && course.price && (
            <div>
              <div className="cd-card-price-old">${course.price}</div>
              <div className="cd-card-discount">{discountPct}% OFF</div>
            </div>
          )}
        </div>

        <div className="cd-card-countdown">
          <span>⚡</span>
          <span>Deal ends in</span>
          <span className="cd-countdown-timer">{timer}</span>
        </div>

        <button className="cd-enroll-btn" onClick={onEnrollClick} disabled={enrollDisabled}>
          <span>{enrollLabel}</span>
        </button>
        <button className="cd-try-btn" onClick={hasPreview ? onPreviewClick : undefined} disabled={!hasPreview}>
          Try Free Preview ({course.previewLessons?.length || 0} Lessons)
        </button>

        <div className="cd-card-includes">
          <div className="cd-card-includes-title">This Course Includes</div>
          <div className="cd-include-item">
            <span className="cd-ico">▶</span> {videoDurationLabel} on-demand video
          </div>
          <div className="cd-include-item">
            <span className="cd-ico">📁</span> {course.totalMaterials || 0} downloadable resources
          </div>
          <div className="cd-include-item">
            <span className="cd-ico">🔗</span> Full source files included
          </div>
          <div className="cd-include-item">
            <span className="cd-ico">💬</span> Private community access
          </div>
          {course.certificateEnabled && (
            <div className="cd-include-item">
              <span className="cd-ico">🏆</span> Certificate of completion
            </div>
          )}
          <div className="cd-include-item">
            <span className="cd-ico">♾️</span> Lifetime access
          </div>
        </div>

        <div className="cd-card-guarantee">
          <em>30-Day Money-Back Guarantee</em>
          <br />
          No questions asked. Full refund within 30 days.
        </div>
      </div>
    </div>
  );
}

/* ── Hero ── */
export default function CDHero({
  course,
  cardRef,
  onEnroll,
  enrollLabel = "Enroll Now — Get Instant Access",
  enrollDisabled = false,
}) {
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState({ url: "", title: "" });

  if (!course) return null;

  const stars = "★".repeat(Math.round(course.rating || 0));
  const heroDurationLabel = Number(course?.totalDuration || 0) < 60
    ? `${Number(course?.totalDuration || 0)}m`
    : `${Math.round(((Number(course?.totalDuration || 0) / 60) * 10)) / 10}h`;

  const findFirstPreviewVideo = () => {
    if (course?.trailerVideo) {
      return { url: course.trailerVideo, title: `${course.title} - Trailer` };
    }

    const modules = Array.isArray(course?.modules) ? course.modules : [];
    for (const mod of modules) {
      const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
      const freeVideo = lessons.find((l) => l?.isFree && l?.type === "video" && l?.videoId?.url);
      if (freeVideo) {
        return {
          url: freeVideo.videoId.url,
          title: freeVideo.title || "Free Preview",
        };
      }
    }

    return null;
  };

  const preview = findFirstPreviewVideo();
  const hasPreview = !!preview?.url;

  const handleOpenPreview = () => {
    if (!preview?.url) return;
    setPreviewVideo(preview);
    setVideoPlayerOpen(true);
  };

  const handleClosePreview = () => {
    setVideoPlayerOpen(false);
    setPreviewVideo({ url: "", title: "" });
  };

  return (
    <div className="cd-detail-hero">
      <VideoPlayer
        isOpen={videoPlayerOpen}
        onClose={handleClosePreview}
        videoUrl={previewVideo.url}
        title={previewVideo.title || "Course Preview"}
        lessonTitle={previewVideo.title || "Course Preview"}
      />

      {/* Animated BG SVG */}
      <svg className="cd-dh-bg-svg" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5c518" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f5c518" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform="translate(250,250)">
          <polygon points="0,-220 190,-110 190,110 0,220 -190,110 -190,-110" fill="none" stroke="url(#bg1)" strokeWidth="1">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite" />
          </polygon>
          <polygon points="0,-180 156,-90 156,90 0,180 -156,90 -156,-90" fill="none" stroke="url(#bg1)" strokeWidth="0.8">
            <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="40s" repeatCount="indefinite" />
          </polygon>
          <polygon points="0,-110 95,-55 95,55 0,110 -95,55 -95,-55" fill="none" stroke="url(#bg1)" strokeWidth="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="indefinite" />
          </polygon>
          <circle r="12" fill="#f5c518" opacity="0.6">
            <animate attributeName="r" values="12;20;12" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* LEFT CONTENT */}
      <div className="cd-dh-left">
        <div className="cd-breadcrumb">
          <Link to="/courses">Courses</Link>
          <span>›</span>
          <span>{course.category}</span>
        </div>

        <div className="cd-dh-badge">⭐ BESTSELLER</div>

        {/* Title — first highlighted word gets yellow */}
        <div className="cd-dh-title">
          {(() => {
            const words = course.title.split(" ");
            // Break into lines of ~3 words each, highlight the 3rd word
            return words.map((word, i) => (
              <span key={i}>
                {i > 0 && i % 3 === 0 && <br />}
                {i === 2
                  ? <span style={{ color: "#f5c518" }}>{word}{" "}</span>
                  : `${word} `
                }
              </span>
            ));
          })()}
        </div>

        <p className="cd-dh-desc">{course.description}</p>

        <div className="cd-dh-meta-row">
          <div className="cd-dh-meta-item">
            <span className="cd-dh-meta-icon">⏱</span>
            <em>{heroDurationLabel}</em> of content
          </div>
          <div className="cd-dh-meta-item">
            <span className="cd-dh-meta-icon">📖</span>
            <em>{course.totalModules}</em> modules
          </div>
          <div className="cd-dh-meta-item">
            <span className="cd-dh-meta-icon">🎯</span>
            <em>{course.level}</em>
          </div>
          <div className="cd-dh-meta-item">
            <span className="cd-dh-meta-icon">🌐</span>
            <em>{course.language}</em>
          </div>
        </div>

        <div className="cd-dh-rating-row">
          <span className="cd-stars-large">{stars || "★★★★★"}</span>
          <span className="cd-rating-num">{course.rating}</span>
          <span className="cd-rating-count">
            ({(course.totalReviews || 0).toLocaleString()} ratings) · {(course.enrolledCount || 0).toLocaleString()} students
          </span>
        </div>

        <div className="cd-dh-tags">
          {(course.tags || []).map((tag) => (
            <span key={tag} className="cd-tag">{tag}</span>
          ))}
        </div>

        <div className="cd-dh-updated">
          Last updated: <em>March 2025</em> · Instructor:{" "}
          <strong>
            {typeof course.instructor === "object"
              ? `${course.instructor.firstName} ${course.instructor.lastName}`
              : "Instructor"}
          </strong>
        </div>
      </div>

      {/* FLOATING CARD */}
      <EnrollCard
        course={course}
        cardRef={cardRef}
        onPreviewClick={handleOpenPreview}
        hasPreview={hasPreview}
        onEnrollClick={onEnroll}
        enrollLabel={enrollLabel}
        enrollDisabled={enrollDisabled}
      />
    </div>
  );
}
