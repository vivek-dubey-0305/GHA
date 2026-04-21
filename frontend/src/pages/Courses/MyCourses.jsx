/**
 * pages/Courses/MyCourses.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, Video } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState, SearchBar } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import MyCoursesCard from "../../components/CoursePages/dashboard/MyCoursesCard";
import { COURSE_TABS } from "../../constants/dashboard.constants";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice.js";
import { getMyReviews } from "../../redux/slices/course.slice.js";

export default function MyCourses() {
  const dispatch = useDispatch();
  const [activeTabLabel, setActiveTabLabel] = useState(COURSE_TABS[0]);
  const [query, setQuery] = useState("");
  const { myEnrollments, loading, error } = useSelector((state) => state.enrollment);
  const { myReviews } = useSelector((state) => state.course);

  const normalizedQuery = query.trim();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(normalizedQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [normalizedQuery]);

  useEffect(() => {
    dispatch(getMyReviews({ page: 1, limit: 200 }));
  }, [dispatch]);

  useEffect(() => {
    if (activeTabLabel === "Wishlist") return;

    const status = activeTabLabel === "Completed" ? "completed" : "active";
    dispatch(getMyEnrollments({ page: 1, limit: 100, status, search: debouncedQuery }));
  }, [dispatch, activeTabLabel, debouncedQuery]);

  const reviewMapByCourse = useMemo(() => {
    const map = {};
    (myReviews || []).forEach((review) => {
      const courseId = String(review?.course?._id || review?.course || "");
      if (courseId) map[courseId] = review;
    });
    return map;
  }, [myReviews]);

  const items = activeTabLabel === "Wishlist" ? [] : myEnrollments;

  const groupedByType = useMemo(() => {
    return items.reduce(
      (acc, enrollment) => {
        const courseType = String(enrollment?.course?.type || "recorded").toLowerCase();
        if (courseType === "live") {
          acc.live.push(enrollment);
        } else {
          acc.recorded.push(enrollment);
        }
        return acc;
      },
      { recorded: [], live: [] }
    );
  }, [items]);

  const showSplitByType = activeTabLabel !== "Wishlist";

  return (
    <UserLayout>
      <PageShell
        title="My Courses"
        subtitle="Track your learning journey across all enrolled courses."
      >
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <TabBar tabs={COURSE_TABS} active={activeTabLabel} onChange={setActiveTabLabel} />
          <SearchBar value={query} onChange={setQuery} placeholder="Search courses…" />
        </div>

        {/* Grid */}
        {loading ? (
          <SearchPulseLoader
            label="Syncing your courses"
            sublabel="Refreshing enrollments for your search"
            className="my-4"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses here yet"
            subtitle={activeTabLabel === "Wishlist" ? "Save courses to your wishlist to access them here." : "You have no courses in this category."}
          />
        ) : (
          <div className="space-y-6">
            {showSplitByType && groupedByType.recorded.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-300" />
                  <h3 className="text-sm font-semibold text-white">Recorded Courses</h3>
                  <span className="text-[11px] text-gray-500">{groupedByType.recorded.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedByType.recorded.map((enr, i) => (
                    <MyCoursesCard
                      key={enr._id || `${enr?.course?._id}_${i}`}
                      enrollment={enr}
                      delay={i * 0.05}
                      userReview={reviewMapByCourse[String(enr?.course?._id || "")] || null}
                    />
                  ))}
                </div>
              </section>
            )}

            {showSplitByType && groupedByType.live.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Video className="w-4 h-4 text-green-300" />
                  <h3 className="text-sm font-semibold text-white">Live Batches</h3>
                  <span className="text-[11px] text-gray-500">{groupedByType.live.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedByType.live.map((enr, i) => (
                    <MyCoursesCard
                      key={enr._id || `${enr?.course?._id}_${i}`}
                      enrollment={enr}
                      delay={i * 0.05}
                      userReview={reviewMapByCourse[String(enr?.course?._id || "")] || null}
                    />
                  ))}
                </div>
              </section>
            )}

            {!showSplitByType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((enr, i) => (
                  <MyCoursesCard
                    key={enr._id || `${enr?.course?._id}_${i}`}
                    enrollment={enr}
                    delay={i * 0.05}
                    userReview={reviewMapByCourse[String(enr?.course?._id || "")] || null}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </PageShell>
    </UserLayout>
  );
}
