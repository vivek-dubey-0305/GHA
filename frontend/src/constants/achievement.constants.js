export const ACHIEVEMENT_TABS = [
  { key: 'all', label: 'All Achievements' },
  { key: 'course', label: 'Course Achievements' },
  { key: 'assignment', label: 'Assignment Achievements' },
  { key: 'streak', label: 'Streak Achievements' },
  { key: 'live', label: 'Live Session Achievements' },
  { key: 'missed', label: 'Missed Opportunities' },
];

export const ACHIEVEMENT_STATUS_META = {
  achieved: {
    label: 'Achieved',
    card: 'border-emerald-500/25 bg-emerald-500/5',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  partial: {
    label: 'Partial',
    card: 'border-yellow-500/25 bg-yellow-500/5',
    badge: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
    dot: 'bg-yellow-400',
  },
  missed: {
    label: 'Missed',
    card: 'border-red-500/30 bg-red-500/5',
    badge: 'border-red-500/40 bg-red-500/15 text-red-300',
    dot: 'bg-red-400',
  },
};

export const ACHIEVEMENT_CATEGORY_LABELS = {
  course: 'Course',
  assignment: 'Assignment',
  streak: 'Streak',
  live: 'Live Session',
};
