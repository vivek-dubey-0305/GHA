import { useEffect, useMemo, useState } from "react";
import { getIconByLessonType, IconPresets } from "../../../utils/iconRenderer";
import { apiClient } from "../../../utils/api.utils.js";
import { devError, devLog } from "../../../utils/devLogger.js";
import { formatDuration, getLessonDurationMinutes, getModuleDurationMinutes } from "../../../utils/format.utils.js";
import VideoPlayer from "./VideoPlayer";

function ModuleItem({ 
  mod, 
  index, 
  isOpen, 
  onToggle, 
  onPlayVideo
}) {
  const lessons = Array.isArray(mod.lessonDetails)
    ? mod.lessonDetails
    : Array.isArray(mod.lessons)
      ? mod.lessons
      : [];

  const handleLessonClick = async (lesson) => {
    if (!lesson?.isFree) return;

    if (lesson.type === "video") {
      const videoUrl = lesson?.videoId?.url;
      if (videoUrl) onPlayVideo(videoUrl, lesson.title || "Video Preview");
      return;
    }

    if (lesson.type === "material") {
      const materialUrl = lesson?.materialId?.fileUrl;
      if (materialUrl) {
        window.open(materialUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (lesson.type === "article") {
      const article = lesson?.content?.articleContent;
      if (article) {
        const articleWindow = window.open("", "_blank", "noopener,noreferrer");
        if (articleWindow) {
          articleWindow.document.write(`<pre style="white-space:pre-wrap;font-family:system-ui;padding:16px;">${article.replace(/</g, "&lt;")}</pre>`);
          articleWindow.document.close();
        }
      }
    }
  };

  return (
    <div className="cd-module">
      <div
        className={`cd-module-header${isOpen ? " open" : ""}`}
        onClick={onToggle}
      >
        <span className="cd-module-num">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="cd-module-title-text">{mod.title}</span>
        <span className="cd-module-meta">
          {mod.totalLessons || lessons.length} lessons ·{" "}
          {formatDuration(getModuleDurationMinutes(mod))}
        </span>
        <span className="cd-module-arrow">▶</span>
      </div>

      <div className={`cd-module-lessons${isOpen ? " open" : ""}`}>
        {lessons.map((lesson, li) => (
          <div
            key={lesson._id || li}
            className={`cd-lesson ${lesson.isFree ? "cd-lesson-free-access" : "cd-lesson-locked"}`}
            onClick={() => handleLessonClick(lesson)}
            style={{ cursor: lesson.isFree ? "pointer" : "default" }}
          >
            {/* Lesson Type Icon */}
            <div className="cd-lesson-icon-wrapper">
              {lesson.isFree ? (
                <span className="cd-lesson-free-badge">
                  {getIconByLessonType(lesson.type, { size: 14 })}
                </span>
              ) : (
                <span className="cd-lesson-lock-badge">
                  {IconPresets.lockIcon({ size: 14 })}
                </span>
              )}
            </div>

            {/* Lesson Content */}
            <div className="cd-lesson-content">
              <span className="cd-lesson-name">
                Lesson {li + 1} — {lesson.title || "Untitled"}
              </span>
              <span className="cd-lesson-type">
                {lesson.type === "video"
                  ? "Video"
                  : lesson.type === "assignment"
                    ? "Assignment"
                    : lesson.type === "live"
                      ? "🔴 Live Class"
                      : lesson.type === "article"
                        ? "Article"
                        : `Resource${lesson?.materialId?.type ? ` (${lesson.materialId.type})` : ""}`}
              </span>
            </div>

            {/* Duration or Action */}
            <div className="cd-lesson-action">
              <span className="cd-lesson-dur">{formatDuration(getLessonDurationMinutes(lesson))}</span>
            </div>
          </div>
        ))}

        {/* Fallback lessons if none populated */}
        {lessons.length === 0 &&
          Array.from({ length: mod.totalLessons || 3 }).map((_, li) => (
            <div key={li} className="cd-lesson cd-lesson-fallback">
              <div className="cd-lesson-icon-wrapper">
                <span className={`cd-lesson-free-badge ${li < 2 ? "" : "cd-lesson-lock-badge"}`}>
                  {li < 2 ? (
                    getIconByLessonType("video", { size: 14 })
                  ) : (
                    IconPresets.lockIcon({ size: 14 })
                  )}
                </span>
              </div>

              <div className="cd-lesson-content">
                <span className="cd-lesson-name">
                  Lesson {li + 1} — {mod.title}
                </span>
                <span className="cd-lesson-type">Video</span>
              </div>

              <div className="cd-lesson-action">
                <span className="cd-lesson-dur">
                  {formatDuration(Math.round((mod.totalDuration || 0) / (mod.totalLessons || 1)))}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CDCurriculum({ course, modules }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState({ url: "", title: "" });
  const [totalMaterials, setTotalMaterials] = useState(0);

  const totalModules = Number(course?.totalModules || 0);
  const totalLessons = Number(course?.totalLessons || 0);
  const totalDuration = Number(course?.totalDuration || 0);
  const durationLabel = formatDuration(totalDuration);

  const hasRenderableModules = Array.isArray(modules) && modules.some((m) => m && typeof m === "object" && !Array.isArray(m));

  const displayModules = useMemo(() => {
    if (hasRenderableModules) return modules;
    if (totalModules <= 0) return [];

    const baseLessons = Math.floor(totalLessons / totalModules);
    const remainderLessons = totalLessons % totalModules;

    return Array.from({ length: totalModules }, (_, i) => {
      const moduleLessons = baseLessons + (i < remainderLessons ? 1 : 0);
      return {
        _id: `fallback-module-${i + 1}`,
        title: `Module ${i + 1}`,
        totalLessons: moduleLessons,
        totalDuration: totalModules > 0 ? Math.round(totalDuration / totalModules) : 0,
        lessons: [],
      };
    });
  }, [hasRenderableModules, modules, totalModules, totalLessons, totalDuration]);

  const moduleMaterialCount = useMemo(() => {
    if (!Array.isArray(displayModules)) return 0;
    return displayModules.reduce((sum, mod) => {
      const lessons = Array.isArray(mod?.lessons) ? mod.lessons : Array.isArray(mod?.lessonDetails) ? mod.lessonDetails : [];
      return sum + lessons.filter((lesson) => lesson?.type === "material" && lesson?.materialId).length;
    }, 0);
  }, [displayModules]);

  const resourcesCount = moduleMaterialCount > 0 ? moduleMaterialCount : totalMaterials;

  /**
   * Fetch materials count for the course
   */
  useEffect(() => {
    const fetchMaterialsCount = async () => {
      if (!course?._id) return;

      try {
        const response = await apiClient.get(`/materials/course/${course._id}`);
        
        if (response?.data?.data?.materials) {
          // Count publishable/downloadable materials
          const materials = response.data.data.materials;
          const downloadableTypes = [
            "document",
            "presentation",
            "spreadsheet",
            "pdf",
            "image",
            "video",
            "audio",
            "code",
          ];

          const count = materials.filter((m) =>
            downloadableTypes.includes(m.type?.toLowerCase())
          ).length;

          setTotalMaterials(count);
          devLog("Course materials count fetched", { courseId: course._id, count });
        }
      } catch (error) {
        devError("Course materials count fetch failed", { courseId: course._id, error: error?.message || error });
        setTotalMaterials(moduleMaterialCount || 0);
      }
    };

    if (moduleMaterialCount > 0) return;

    fetchMaterialsCount();
  }, [course?._id, moduleMaterialCount]);

  /**
   * Handle video player open
   */
  const handlePlayVideo = (videoUrl, videoTitle) => {
    setCurrentVideo({ url: videoUrl, title: videoTitle });
    setVideoPlayerOpen(true);
  };

  /**
   * Handle video player close
   */
  const handleCloseVideo = () => {
    setVideoPlayerOpen(false);
    setTimeout(() => {
      setCurrentVideo({ url: "", title: "" });
    }, 300);
  };

  if (!course) return null;

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <>
      {/* Video Player Modal */}
      {typeof window !== "undefined" && (
        <VideoPlayer
          isOpen={videoPlayerOpen}
          onClose={handleCloseVideo}
          videoUrl={currentVideo.url}
          title={currentVideo.title}
          lessonTitle={currentVideo.title}
        />
      )}

      {/* Stats */}
      <div className="cd-curriculum-stats cp-reveal">
        <div className="cd-curr-stat">
          <div className="cd-curr-stat-num">{course.totalModules}</div>
          <div className="cd-curr-stat-label">Modules</div>
        </div>
        <div className="cd-curr-stat">
          <div className="cd-curr-stat-num">{course.totalLessons}</div>
          <div className="cd-curr-stat-label">Lessons</div>
        </div>
        <div className="cd-curr-stat">
          <div className="cd-curr-stat-num">{durationLabel}</div>
          <div className="cd-curr-stat-label">Duration</div>
        </div>
        <div className="cd-curr-stat">
          <div className="cd-curr-stat-num">{resourcesCount || "0"}</div>
          <div className="cd-curr-stat-label">Resources</div>
        </div>
      </div>

      {/* Modules accordion */}
      <div id="cd-modulesAccordion">
        {displayModules.length > 0 ? (
          displayModules.map((mod, i) => (
            <ModuleItem
              key={mod._id || i}
              mod={mod}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
              onPlayVideo={handlePlayVideo}
            />
          ))
        ) : (
          <div className="cd-review-item">
            <div className="cd-review-text">
              Curriculum will be available soon for this course.
            </div>
          </div>
        )}
      </div>
    </>
  );
}
