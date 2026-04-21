import { useState } from "react";
import CDOverview from "./CDOverview";
import CDCurriculum from "./CDCurriculum";
import CDInstructor from "./CDInstructor";
import CDReviews from "./CDReviews";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "instructor", label: "Instructor" },
  { id: "reviews", label: "Reviews" },
];

export default function CDTabs({
  course,
  modules,
  instructor,
  reviews,
  ratingStats,
  loadingReviews,
  activeTab,
  onTabChange,
  openReviewComposerToken,
}) {
  const [internalActiveTab, setInternalActiveTab] = useState("overview");
  const resolvedActiveTab = activeTab || internalActiveTab;
  const handleTabChange = (nextTab) => {
    if (onTabChange) {
      onTabChange(nextTab);
      return;
    }
    setInternalActiveTab(nextTab);
  };

  return (
    <section className="cd-tabs-section" id="cd-reviews-anchor">
      {/* Tab nav */}
      <div className="cd-tabs-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cd-tab-btn${resolvedActiveTab === tab.id ? " active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className={`cd-tab-panel${resolvedActiveTab === "overview" ? " active" : ""}`}>
        <CDOverview course={course} />
      </div>
      <div className={`cd-tab-panel${resolvedActiveTab === "curriculum" ? " active" : ""}`}>
        <CDCurriculum course={course} modules={modules} />
      </div>
      <div className={`cd-tab-panel${resolvedActiveTab === "instructor" ? " active" : ""}`}>
        <CDInstructor instructor={instructor} />
      </div>
      <div className={`cd-tab-panel${resolvedActiveTab === "reviews" ? " active" : ""}`}>
        <CDReviews
          course={course}
          reviews={reviews}
          ratingStats={ratingStats}
          loadingReviews={loadingReviews}
          openComposerToken={openReviewComposerToken}
        />
      </div>
    </section>
  );
}
