export function ProfileTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-max flex items-center gap-1 border-b border-gray-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-1.5 ${
                isActive
                  ? 'text-white border-white'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileStats({ profile }) {
  const cards = [
    { label: 'AVG RATING', value: Number(profile?.rating?.averageRating || 0).toFixed(2) },
    { label: 'REVIEWS', value: profile?.rating?.totalReviews || profile?.totalReviews || 0 },
    { label: 'STUDENTS', value: profile?.totalStudentsTeaching || 0 },
    { label: 'COURSES', value: profile?.totalCourses || 0 }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-[#111] border border-gray-800 rounded-xl p-4">
          <p className="text-white text-2xl font-bold">{Intl.NumberFormat().format(Number(card.value) || 0)}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 tracking-[0.15em] mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
