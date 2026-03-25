/**
 * pages/Analytics/LearningAnalytics.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Clock, TrendingUp, Target } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle, Card, StatCard, fadeUp } from "../../components/DashboardPages/DashboardUI";
import { apiClient } from "../../utils/api.utils";
import { getMyEnrollments } from "../../redux/slices/enrollment.slice";

// ─── Reusable bar chart ───────────────────────────────────────────────────────
function BarChart({ data, valueKey, labelKey, unit = "", barColor = "bg-yellow-400/70 hover:bg-yellow-400" }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1.5 h-36 w-full">
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 group/bar">
            <span className="text-[9px] text-gray-700 group-hover/bar:text-gray-500 transition-colors">
              {d[valueKey]}{unit}
            </span>
            <motion.div
              className={`w-full rounded-t-lg ${barColor} transition-colors`}
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
            />
            <span className="text-[9px] text-gray-600">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Line sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, valueKey }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  const w = 100 / (data.length - 1);
  const points = data
    .map((d, i) => `${i * w},${100 - (d[valueKey] / max) * 90}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#spark)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#FFD700"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <circle key={i} cx={i * w} cy={100 - (d[valueKey] / max) * 90} r="2.5" fill="#FFD700" />
      ))}
    </svg>
  );
}

export default function LearningAnalytics() {
  const dispatch = useDispatch();
  const { myEnrollments } = useSelector((state) => state.enrollment);

  const [submissions, setSubmissions] = useState([]);
  const [progressStats, setProgressStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(getMyEnrollments({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, submissionsRes] = await Promise.all([
          apiClient.get("/progress/stats"),
          apiClient.get("/submissions/my?limit=100"),
        ]);

        setProgressStats(statsRes?.data?.data || null);
        setSubmissions(submissionsRes?.data?.data?.submissions || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const enrollments = myEnrollments || [];

  const weeklyStudyData = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const buckets = labels.map((day) => ({ day, hours: 0 }));
    const now = new Date();

    enrollments.forEach((enr) => {
      const ts = enr?.lastAccessedAt ? new Date(enr.lastAccessedAt) : null;
      if (!ts || Number.isNaN(ts.getTime())) return;

      const diff = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
      if (diff < 0 || diff > 6) return;

      const dayIdx = (ts.getDay() + 6) % 7;
      buckets[dayIdx].hours += Number(enr?.timeSpent || 0) / 60;
    });

    return buckets.map((b) => ({ ...b, hours: Number(b.hours.toFixed(1)) }));
  }, [enrollments]);

  const monthlyStudyData = useMemo(() => {
    const now = new Date();
    const monthLabels = [];
    const map = new Map();

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      monthLabels.push(label);
      map.set(label, 0);
    }

    enrollments.forEach((enr) => {
      const ts = enr?.lastAccessedAt ? new Date(enr.lastAccessedAt) : null;
      if (!ts || Number.isNaN(ts.getTime())) return;

      const label = ts.toLocaleDateString("en-IN", { month: "short" });
      if (map.has(label)) {
        map.set(label, map.get(label) + Number(enr?.timeSpent || 0) / 60);
      }
    });

    return monthLabels.map((month) => ({ month, hours: Number((map.get(month) || 0).toFixed(1)) }));
  }, [enrollments]);

  const courseCompletionData = useMemo(
    () => enrollments.map((enr, idx) => ({
      name: enr?.course?.title || "Untitled Course",
      progress: Number(enr?.progressPercentage || 0),
      color: ["#facc15", "#22c55e", "#60a5fa", "#f97316", "#a78bfa"][idx % 5],
    })),
    [enrollments]
  );

  const gradedSubs = submissions.filter((s) => s?.status === "graded" && Number.isFinite(s?.score));
  const avgAccuracy = gradedSubs.length
    ? Math.round(gradedSubs.reduce((sum, s) => sum + ((Number(s.score) / Number(s.maxScore || 100)) * 100), 0) / gradedSubs.length)
    : 0;

  const quizAccuracyData = useMemo(() => {
    const recent = gradedSubs.slice(0, 6).reverse();
    if (recent.length === 0) {
      return [1, 2, 3, 4, 5, 6].map((w) => ({ week: `W${w}`, accuracy: 0 }));
    }
    return recent.map((s, i) => ({
      week: `W${i + 1}`,
      accuracy: Math.round((Number(s.score || 0) / Number(s.maxScore || 100)) * 100),
    }));
  }, [gradedSubs]);

  const avgWeekly = (weeklyStudyData.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1);
  const avgCourseProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + Number(e?.progressPercentage || 0), 0) / enrollments.length)
    : 0;
  const currentMonthHours = monthlyStudyData[monthlyStudyData.length - 1]?.hours || 0;

  return (
    <UserLayout>
      <PageShell title="Learning Analytics" subtitle="Visualize your learning patterns and progress.">
        {loading && <p className="text-gray-500 text-sm py-2">Loading analytics...</p>}
        {!loading && error && <p className="text-red-400 text-sm py-2">{error}</p>}

        {/* KPI row */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Clock,    label: "Avg Daily Study",     value: `${avgWeekly}h`,              subtitle: "This week"           },
            { icon: Target,   label: "Quiz Accuracy",       value: `${avgAccuracy}%`,             subtitle: "Last 6 weeks"        },
            { icon: TrendingUp, label: "Courses Progress",  value: `${avgCourseProgress}%`,       subtitle: "Avg across active"   },
            { icon: BarChart2,  label: "Monthly Hours",     value: `${currentMonthHours}h`,       subtitle: "This month" },
          ].map((c) => <StatCard key={c.label} {...c} />)}
        </motion.div>

        {/* Weekly study bar chart */}
        <motion.div {...fadeUp(0.1)}>
          <SectionTitle icon={Clock}>Weekly Study Hours</SectionTitle>
          <Card className="p-5">
            <BarChart data={weeklyStudyData} valueKey="hours" labelKey="day" unit="h" />
          </Card>
        </motion.div>

        {/* Monthly trend sparkline */}
        <motion.div {...fadeUp(0.15)}>
          <SectionTitle icon={TrendingUp}>Monthly Learning Trend</SectionTitle>
          <Card className="p-5">
            <Sparkline data={monthlyStudyData} valueKey="hours" />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              {monthlyStudyData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Quiz accuracy bar chart */}
        <motion.div {...fadeUp(0.2)}>
          <SectionTitle icon={Target}>Quiz Accuracy (Last 6 Weeks)</SectionTitle>
          <Card className="p-5">
            <BarChart
              data={quizAccuracyData}
              valueKey="accuracy"
              labelKey="week"
              unit="%"
              barColor="bg-blue-400/60 hover:bg-blue-400"
            />
          </Card>
        </motion.div>

        {/* Course completion breakdown */}
        <motion.div {...fadeUp(0.25)}>
          <SectionTitle icon={BarChart2}>Course Completion</SectionTitle>
          <Card className="p-5 space-y-4">
            {courseCompletionData.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-300 truncate max-w-[70%]">{c.name}</span>
                  <span className="text-white font-semibold">{c.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </motion.div>

      </PageShell>
    </UserLayout>
  );
}
