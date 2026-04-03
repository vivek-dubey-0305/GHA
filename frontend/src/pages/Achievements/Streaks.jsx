import { useEffect } from 'react';
import { Flame, CalendarDays, Trophy, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { UserLayout } from '../../components/layout/UserLayout';
import { Card, PageShell, StatCard, YellowButton } from '../../components/DashboardPages/DashboardUI';
import { fetchMyStreak, markStreakActivity } from '../../redux/slices/streak.slice.js';

export default function Streaks() {
  const dispatch = useDispatch();
  const { summary, loading, marking } = useSelector((state) => state.streak);

  useEffect(() => {
    dispatch(fetchMyStreak());
  }, [dispatch]);

  const weekly = Array.isArray(summary?.weeklyActivity) ? summary.weeklyActivity : [];

  return (
    <UserLayout>
      <PageShell
        title="Streaks"
        subtitle="Track daily learning consistency and keep your momentum alive."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Flame} label="Current Streak" value={`${summary?.currentStreak || 0}d`} accent />
          <StatCard icon={Trophy} label="Longest Streak" value={`${summary?.longestStreak || 0}d`} />
          <StatCard icon={CalendarDays} label="Active Days" value={summary?.totalActiveDays || 0} />
          <StatCard
            icon={CheckCircle2}
            label="Today"
            value={summary?.todayActive ? 'Completed' : 'Pending'}
            subtitle={summary?.todayActive ? 'Great consistency' : 'Mark activity to keep streak'}
          />
        </div>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-white font-semibold text-lg">7-Day Activity</h2>
              <p className="text-gray-500 text-sm">Your daily streak consistency snapshot</p>
            </div>

            <YellowButton
              onClick={() => dispatch(markStreakActivity())}
              disabled={marking || summary?.todayActive}
            >
              {summary?.todayActive ? 'Already Marked Today' : marking ? 'Marking...' : 'Mark Today Activity'}
            </YellowButton>
          </div>

          {loading ? (
            <div className="mt-5 text-sm text-gray-500">Loading streak data...</div>
          ) : (
            <div className="grid grid-cols-7 gap-2 mt-5">
              {weekly.map((item) => (
                <div key={item.dateKey} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full h-12 rounded-lg border transition-colors ${
                      item.active
                        ? 'bg-orange-400/80 border-orange-300/70'
                        : 'bg-gray-900 border-gray-800'
                    }`}
                    title={item.dateKey}
                  />
                  <span className={`text-xs ${item.isToday ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageShell>
    </UserLayout>
  );
}
