import { Star } from 'lucide-react';
import { SectionCard } from '../ProfileCommon';

const buckets = [
  { key: 'fivestar', label: '5 Star' },
  { key: 'fourstar', label: '4 Star' },
  { key: 'threestar', label: '3 Star' },
  { key: 'twostar', label: '2 Star' },
  { key: 'onestar', label: '1 Star' }
];

export function RatingSection({ profile }) {
  const breakdown = profile?.rating?.ratingBreakdown || {};

  return (
    <SectionCard title="Current Rating" subtitle="Live rating data from student reviews" icon={Star}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <Metric title="Average Rating" value={Number(profile?.rating?.averageRating || 0).toFixed(2)} />
        <Metric title="Total Reviews" value={profile?.rating?.totalReviews || profile?.totalReviews || 0} />
        <Metric title="Total Students" value={profile?.totalStudentsTeaching || 0} />
      </div>

      <div className="space-y-2">
        {buckets.map((bucket) => {
          const value = Number(breakdown[bucket.key] || 0);
          const total = Math.max(Number(profile?.rating?.totalReviews || 0), 1);
          const width = Math.min((value / total) * 100, 100);

          return (
            <div key={bucket.key} className="grid grid-cols-[68px_1fr_56px] items-center gap-2 text-xs text-gray-400">
              <span>{bucket.label}</span>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${width}%` }} />
              </div>
              <span className="text-right">{value}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function Metric({ title, value }) {
  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-lg font-semibold text-white mt-1">{Intl.NumberFormat().format(Number(value) || 0)}</p>
    </div>
  );
}
