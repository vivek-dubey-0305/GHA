/**
 * pages/Courses/MyCourses.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState, SearchBar } from "../../components/DashboardPages/DashboardUI";
import MyCoursesCard from "../../components/CoursePages/dashboard/MyCoursesCard";
import { COURSE_TABS } from "../../constants/dashboard.constants";
import { useSearch } from "../../hooks/useDashboard";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice.js";

export default function MyCourses() {
  const dispatch = useDispatch();
  const [activeTabLabel, setActiveTabLabel] = useState(COURSE_TABS[0]);
  const { myEnrollments, loading, error } = useSelector((state) => state.enrollment);

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const tabEnrollments = useMemo(
    () => ({
      "In Progress": myEnrollments.filter((e) => e.status === "active"),
      "Completed": myEnrollments.filter((e) => e.status === "completed"),
      Wishlist: [],
    }),
    [myEnrollments]
  );

  const items = tabEnrollments[activeTabLabel] ?? [];
  const { query, setQuery, filtered } = useSearch(items, ["course.title"]);

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
          <div className="text-gray-400 text-sm py-8">Loading your enrollments...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses here yet"
            subtitle={activeTabLabel === "Wishlist" ? "Save courses to your wishlist to access them here." : "You have no courses in this category."}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((enr, i) => (
              <MyCoursesCard key={enr._id || `${enr?.course?._id}_${i}`} enrollment={enr} delay={i * 0.05} />
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </PageShell>
    </UserLayout>
  );
}
