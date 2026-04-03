/**
 * pages/Achievements/Badges.jsx
 * Achievements dashboard (replaces badges view)
 */
import { useEffect, useMemo } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  Video,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import {
  Card,
  PageShell,
  StatCard,
  TabBar,
} from "../../components/DashboardPages/DashboardUI";
import {
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_STATUS_META,
  ACHIEVEMENT_TABS,
} from "../../constants/achievement.constants";
import {
  fetchMyAchievements,
  setAchievementCourseId,
  setAchievementTab,
} from "../../redux/slices/achievement.slice";
import {
  fetchLeaderboardSummary,
  fetchLeaderboardCourses,
} from "../../redux/slices/leaderboard.slice";

const formatDateTime = (dateLike) => {
  if (!dateLike) return "--";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const POINT_RULES = [
  {
    category: "Course",
    icon: BookOpenCheck,
    rules: [
      "Course enrolled: +10",
      "Lesson completed: +5",
      "Module completed: +20",
      "Course completed: +200",
      "Fast completion bonus: +50",
    ],
  },
  {
    category: "Assignment",
    icon: FileText,
    rules: [
      "Submitted: +20",
      "Submitted before deadline: +10",
      "80% score: +20",
      "90% score: +40",
      "100% score: +60",
      "Missed deadline without late submission: shown as missed",
    ],
  },
  {
    category: "Streak",
    icon: Flame,
    rules: [
      "Daily streak maintained: +5",
      "3-day streak milestone: +10",
      "7-day streak milestone: +20",
      "14-day streak milestone: +40",
      "30-day streak milestone: +100",
    ],
  },
  {
    category: "Live Session",
    icon: Video,
    rules: [
      "Joined live class: +20",
      "Missed live class: shown as missed opportunity",
    ],
  },
];

export default function Badges() {
  const dispatch = useDispatch();
  const { activeTab, courseId, items, summary, loading } = useSelector((state) => state.achievement);
  const courses = useSelector((state) => state.leaderboard.courses || []);
  const rank = useSelector((state) => state.leaderboard.mySummary?.rank || null);

  useEffect(() => {
    dispatch(fetchLeaderboardCourses());
    dispatch(fetchLeaderboardSummary());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMyAchievements());
  }, [dispatch, activeTab, courseId]);

  const tabLabels = ACHIEVEMENT_TABS.map((tab) => tab.label);
  const activeTabLabel = ACHIEVEMENT_TABS.find((tab) => tab.key === activeTab)?.label || ACHIEVEMENT_TABS[0].label;

  const cards = useMemo(() => [
    {
      icon: Trophy,
      label: "Total Points",
      value: Number(summary?.totalPoints || 0).toLocaleString(),
      accent: true,
    },
    {
      icon: Sparkles,
      label: "This Week",
      value: Number(summary?.weekPoints || 0).toLocaleString(),
    },
    {
      icon: AlertTriangle,
      label: "Missed Points",
      value: Number(summary?.missedPoints || 0).toLocaleString(),
    },
    {
      icon: Flame,
      label: "Leaderboard Rank",
      value: rank ? `#${rank}` : "--",
      subtitle: `${summary?.achievedCount || 0} achieved`,
    },
  ], [summary, rank]);

  const onTabChange = (label) => {
    const selected = ACHIEVEMENT_TABS.find((tab) => tab.label === label);
    if (!selected) return;
    dispatch(setAchievementTab(selected.key));
  };

  return (
    <UserLayout>
      <PageShell
        title="Achievements"
        subtitle="Transparent point history: where, when, and why points were achieved, partial, or missed."
        actions={<TabBar tabs={tabLabels} active={activeTabLabel} onChange={onTabChange} />}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1.5 min-w-55">
              <span className="text-xs text-gray-500">Course Filter</span>
              <select
                value={courseId || ""}
                onChange={(e) => dispatch(setAchievementCourseId(e.target.value || null))}
                className="bg-[#0d0d0d] border border-gray-800 rounded-lg text-sm text-gray-200 px-3 py-2.5 focus:outline-none focus:border-yellow-400/60"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.value} value={course.value}>{course.label}</option>
                ))}
              </select>
            </label>

            <div className="text-xs text-gray-500">
              Status: <span className="text-green-400">Achieved</span>, <span className="text-yellow-300">Partial</span>, <span className="text-red-400">Missed</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h2 className="text-white font-semibold text-base sm:text-lg">How Points Are Awarded</h2>
            <p className="text-xs text-gray-500">Transparent rules used in leaderboard and achievements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {POINT_RULES.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.category} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white">{section.category}</h3>
                  </div>
                  <div className="space-y-1">
                    {section.rules.map((rule) => (
                      <p key={rule} className="text-xs text-gray-400">{rule}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-gray-800 bg-[#111] p-8 text-center text-sm text-gray-500">
              Loading achievement history...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-[#111] p-8 text-center text-sm text-gray-500">
              No achievements found for this filter.
            </div>
          ) : (
            items.map((item) => {
              const meta = ACHIEVEMENT_STATUS_META[item.status] || ACHIEVEMENT_STATUS_META.achieved;
              const categoryLabel = ACHIEVEMENT_CATEGORY_LABELS[item.category] || "Achievement";
              const awarded = Number(item.pointsAwarded || 0);
              const possible = Number(item.pointsPossible || awarded);

              return (
                <Card key={item._id} className={`p-4 sm:p-5 border ${meta.card}`} hover={false}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                        <h3 className="text-white font-semibold text-base sm:text-lg">{item.title}</h3>
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                          {item.status === "achieved" ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full">{categoryLabel}</span>
                      </div>

                      <p className="text-sm text-gray-400">{item.description || "Point activity recorded"}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>Date: {formatDateTime(item.occurredAt)}</span>
                        {item?.metadata?.courseTitle && <span>Course: {item.metadata.courseTitle}</span>}
                        {item?.metadata?.assignmentTitle && <span>Assignment: {item.metadata.assignmentTitle}</span>}
                        {item?.metadata?.liveClassTitle && <span>Live: {item.metadata.liveClassTitle}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xl font-bold ${item.status === 'missed' ? 'text-red-400' : item.status === 'partial' ? 'text-yellow-300' : 'text-emerald-300'}`}>
                        {item.status === 'missed' ? '-' : '+'}{awarded}
                      </p>
                      <p className="text-xs text-gray-500">out of {possible} pts</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </PageShell>
    </UserLayout>
  );
}
