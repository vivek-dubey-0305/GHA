/**
 * pages/Analytics/LearningAnalytics.jsx
 */
import { motion } from "framer-motion";
import { BarChart2, Clock, TrendingUp, Target } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle, Card, StatCard, fadeUp } from "../../components/DashboardPages/DashboardUI";
import {
  mockWeeklyStudyData,
  mockMonthlyStudyData,
  mockCourseCompletionData,
  mockQuizAccuracyData,
  mockDashboardSummary,
} from "../../mock/dashboard";

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
  const { stats } = mockDashboardSummary;
  const avgWeekly = (mockWeeklyStudyData.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1);
  const avgAccuracy = Math.round(mockQuizAccuracyData.reduce((s, d) => s + d.accuracy, 0) / mockQuizAccuracyData.length);

  return (
    <UserLayout>
      <PageShell title="Learning Analytics" subtitle="Visualize your learning patterns and progress.">

        {/* KPI row */}
        <motion.div {...fadeUp(0)} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Clock,    label: "Avg Daily Study",     value: `${avgWeekly}h`,              subtitle: "This week"           },
            { icon: Target,   label: "Quiz Accuracy",       value: `${avgAccuracy}%`,             subtitle: "Last 6 weeks"        },
            { icon: TrendingUp, label: "Courses Progress",  value: "57%",                         subtitle: "Avg across active"   },
            { icon: BarChart2,  label: "Monthly Hours",     value: `${mockMonthlyStudyData.at(-1)?.hours}h`, subtitle: "This month" },
          ].map((c) => <StatCard key={c.label} {...c} />)}
        </motion.div>

        {/* Weekly study bar chart */}
        <motion.div {...fadeUp(0.1)}>
          <SectionTitle icon={Clock}>Weekly Study Hours</SectionTitle>
          <Card className="p-5">
            <BarChart data={mockWeeklyStudyData} valueKey="hours" labelKey="day" unit="h" />
          </Card>
        </motion.div>

        {/* Monthly trend sparkline */}
        <motion.div {...fadeUp(0.15)}>
          <SectionTitle icon={TrendingUp}>Monthly Learning Trend</SectionTitle>
          <Card className="p-5">
            <Sparkline data={mockMonthlyStudyData} valueKey="hours" />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              {mockMonthlyStudyData.map((d) => (
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
              data={mockQuizAccuracyData}
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
            {mockCourseCompletionData.map((c, i) => (
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
