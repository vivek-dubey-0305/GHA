import { useState } from "react";

function ModuleItem({ mod, index, isOpen, onToggle }) {
  const lessons = mod.lessonDetails || mod.lessons || [];

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
          {Math.round((mod.totalDuration || 0) / 60 * 10) / 10}h
        </span>
        <span className="cd-module-arrow">▶</span>
      </div>

      <div className={`cd-module-lessons${isOpen ? " open" : ""}`}>
        {lessons.map((lesson, li) => (
          <div key={lesson._id || li} className="cd-lesson">
            {lesson.isFree ? (
              <span className="cd-lesson-free">FREE</span>
            ) : (
              <span className="cd-lesson-icon">🔒</span>
            )}
            <span className="cd-lesson-name">
              {lesson.title || `Lesson ${li + 1}`}
            </span>
            <span className="cd-lesson-dur">
              {lesson.duration
                ? `${Math.floor(lesson.duration / 60)}:${String(lesson.duration % 60).padStart(2, "0")}`
                : "--:--"}
            </span>
          </div>
        ))}
        {/* Fallback lessons if none populated */}
        {lessons.length === 0 &&
          Array.from({ length: mod.totalLessons || 3 }).map((_, li) => (
            <div key={li} className="cd-lesson">
              {li < 2 ? (
                <span className="cd-lesson-free">FREE</span>
              ) : (
                <span className="cd-lesson-icon">🔒</span>
              )}
              <span className="cd-lesson-name">
                Lesson {li + 1} — {mod.title}
              </span>
              <span className="cd-lesson-dur">
                {Math.floor(20 + Math.random() * 25)}:00
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function CDCurriculum({ course, modules }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!course) return null;

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? -1 : i));

  return (
    <>
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
          <div className="cd-curr-stat-num">{course.durationHours}h</div>
          <div className="cd-curr-stat-label">Video</div>
        </div>
        <div className="cd-curr-stat">
          <div className="cd-curr-stat-num">60+</div>
          <div className="cd-curr-stat-label">Resources</div>
        </div>
      </div>

      {/* Modules accordion */}
      <div id="cd-modulesAccordion">
        {modules.map((mod, i) => (
          <ModuleItem
            key={mod._id || i}
            mod={mod}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </>
  );
}
