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

export default function CDTabs({ course, modules, instructor }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="cd-tabs-section">
      {/* Tab nav */}
      <div className="cd-tabs-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cd-tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className={`cd-tab-panel${activeTab === "overview" ? " active" : ""}`}>
        <CDOverview course={course} />
      </div>
      <div className={`cd-tab-panel${activeTab === "curriculum" ? " active" : ""}`}>
        <CDCurriculum course={course} modules={modules} />
      </div>
      <div className={`cd-tab-panel${activeTab === "instructor" ? " active" : ""}`}>
        <CDInstructor instructor={instructor} />
      </div>
      <div className={`cd-tab-panel${activeTab === "reviews" ? " active" : ""}`}>
        <CDReviews course={course} />
      </div>
    </section>
  );
}
