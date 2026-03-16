/**
 * pages/Courses/MyCourses.jsx
 */
import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar, EmptyState, SearchBar } from "../../components/DashboardPages/DashboardUI";
import MyCoursesCard from "../../components/CoursePages/dashboard/MyCoursesCard";
import { mockEnrollments, mockWishlist } from "../../mock/dashboard";
import { COURSE_TABS } from "../../constants/dashboard.constants";
import { useTab, useSearch } from "../../hooks/useDashboard";

export default function MyCourses() {
  const { activeTab, setActiveIndex } = useTab(COURSE_TABS);
  const [activeTabLabel, setActiveTabLabel] = useState(COURSE_TABS[0]);

  const tabEnrollments = {
    "In Progress": mockEnrollments.filter((e) => e.status === "active"),
    "Completed":   mockEnrollments.filter((e) => e.status === "completed"),
    "Wishlist":    mockWishlist.map((c) => ({ _id: `wish_${c._id}`, course: c, progressPercentage: 0, completedLessons: 0, totalLessons: c.totalLessons, status: "wishlist" })),
  };

  const items = tabEnrollments[activeTabLabel] ?? [];
  const { query, setQuery, filtered } = useSearch(items, ["course.title", "course.instructor.firstName"]);

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
        {filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses here yet"
            subtitle={activeTabLabel === "Wishlist" ? "Save courses to your wishlist to access them here." : "You have no courses in this category."}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((enr, i) => (
              <MyCoursesCard key={enr._id} enrollment={enr} delay={i * 0.05} />
            ))}
          </div>
        )}
      </PageShell>
    </UserLayout>
  );
}
