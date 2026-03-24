import { useState } from "react";
import IDAbout     from "./IDAbout";
import IDMyCourses from "./IDMyCourses";
import IDReviews   from "./IDReviews";

const TABS = [
  { id: "about",   label: "About" },
  { id: "courses", label: "My Courses" },
  { id: "reviews", label: "Reviews" },
];

export default function IDTabs({ instructor, reviews, ratingStats, loadingReviews, reviewsError }) {
  const [active, setActive] = useState("about");

  return (
    <>
      <div className="id-tabs-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`id-tab-btn${active === t.id ? " active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`id-tab-panel${active === "about"   ? " active" : ""}`}>
        <IDAbout instructor={instructor}/>
      </div>
      <div className={`id-tab-panel${active === "courses" ? " active" : ""}`}>
        <IDMyCourses instructor={instructor}/>
      </div>
      <div className={`id-tab-panel${active === "reviews" ? " active" : ""}`}>
        <IDReviews
          instructor={instructor}
          reviews={reviews}
          ratingStats={ratingStats}
          loadingReviews={loadingReviews}
          reviewsError={reviewsError}
        />
      </div>
    </>
  );
}
