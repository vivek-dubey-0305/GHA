/**
 * pages/Courses/CourseProgress.jsx
 */
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, BookOpen, CheckCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle, Card, ProgressBar, StatCard, fadeUp } from "../../components/DashboardPages/DashboardUI";
import { formatDuration } from "../../utils/format.utils";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";

// ─── Inline bar chart (CSS) ──────────────────────────────────────────────────

function BarChart({ data, valueKey, labelKey, unit = "" }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] text-gray-600">{d[valueKey]}{unit}</span>
            <motion.div
              className="w-full rounded-t-md bg-yellow-400/60 hover:bg-yellow-400 transition-colors"
              style={{ height: `${pct}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
            />
            <span className="text-[9px] text-gray-600">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CourseProgress() {
  const dispatch = useDispatch();
  const { myEnrollments, loading, error } = useSelector((state) => state.enrollment);

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  const enrollments = myEnrollments || [];
  const active = enrollments.filter((e) => e.status === "active");
  const completed = enrollments.filter((e) => e.status === "completed");
  const totalTime = enrollments.reduce((s, e) => s + Number(e?.timeSpent || 0), 0);
  const avgCompletion = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + Number(e?.progressPercentage || 0), 0) / enrollments.length)
    : 0;

  const weeklyStudyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const buckets = labels.map((day) => ({ day, hours: 0 }));

    enrollments.forEach((enrollment) => {
      const ts = enrollment?.lastAccessedAt ? new Date(enrollment.lastAccessedAt) : null;
      if (!ts || Number.isNaN(ts.getTime())) return;

      const daysDiff = Math.floor((today - ts) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0 || daysDiff > 6) return;

      const dayIndex = (ts.getDay() + 6) % 7;
      buckets[dayIndex].hours += Number(enrollment?.timeSpent || 0) / 60;
    });

    return buckets.map((b) => ({ ...b, hours: Math.round(b.hours * 10) / 10 }));
  }, [enrollments]);

  return (
    <UserLayout>
      <PageShell title="Course Progress" subtitle="Detailed breakdown of your learning analytics.">
        {loading && <p className="text-gray-500 text-sm py-2">Loading progress...</p>}
        {error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {/* Overview stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen,     label: "In Progress",      value: active.length,    subtitle: "Active courses"       },
            { icon: CheckCircle,  label: "Completed",        value: completed.length, subtitle: "Courses finished"     },
            { icon: Clock,        label: "Total Study Time", value: formatDuration(totalTime), subtitle: "Across all courses" },
            { icon: TrendingUp,   label: "Avg. Completion",  value: `${avgCompletion}%`, subtitle: "All courses" },
          ].map((c, i) => (
            <motion.div key={c.label} {...fadeUp(i * 0.06)}>
              <StatCard {...c} />
            </motion.div>
          ))}
        </div>

        {/* Weekly study hours */}
        <motion.div {...fadeUp(0.15)}>
          <SectionTitle icon={Clock}>Weekly Study Hours</SectionTitle>
          <Card className="p-6">
            <BarChart data={weeklyStudyData} valueKey="hours" labelKey="day" unit="h" />
          </Card>
        </motion.div>

        {/* Per-course progress */}
        <motion.div {...fadeUp(0.2)}>
          <SectionTitle icon={TrendingUp}>Course Breakdown</SectionTitle>
          <div className="space-y-3">
            {enrollments.map((enr, i) => (
              <motion.div key={enr._id} {...fadeUp(0.25 + i * 0.05)}>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={enr.course.thumbnail?.secure_url}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover border border-gray-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-medium text-sm line-clamp-1">{enr.course.title}</p>
                        <span className={`text-sm font-bold ml-4 shrink-0 ${
                          enr.progressPercentage >= 75 ? "text-green-400"
                          : enr.progressPercentage >= 40 ? "text-yellow-400"
                          : "text-orange-400"
                        }`}>
                          {enr.progressPercentage}%
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mb-2">
                        {enr.completedLessons}/{enr.totalLessons} lessons · {formatDuration(enr.timeSpent)} studied
                      </p>
                      <ProgressBar value={enr.progressPercentage} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </PageShell>
    </UserLayout>
  );
}
