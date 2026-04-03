//LeaderboardFilters.jsx
import {
  LEADERBOARD_PERIOD_OPTIONS,
  LEADERBOARD_TYPES,
} from '../../constants/leaderboard.constants.js';

function SelectField({ label, value, onChange, options = [], disabled = false }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[180px]">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="bg-[#111] border border-gray-800 rounded-lg text-sm text-gray-200 px-3 py-2.5 focus:outline-none focus:border-yellow-400/50 disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function LeaderboardFilters({
  activeType,
  period,
  courseId,
  assignmentCourseId,
  courseOptions,
  onPeriodChange,
  onCourseChange,
  onAssignmentCourseChange,
}) {
  const showPeriod = activeType === LEADERBOARD_TYPES.GLOBAL;
  const showCourse = activeType === LEADERBOARD_TYPES.COURSE;
  const showAssignment = activeType === LEADERBOARD_TYPES.ASSIGNMENT;

  const assignmentOptions = [
    { value: '', label: 'All Courses' },
    ...courseOptions,
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      {showPeriod && (
        <SelectField
          label="Global Period"
          value={period}
          onChange={onPeriodChange}
          options={LEADERBOARD_PERIOD_OPTIONS}
        />
      )}

      {showCourse && (
        <SelectField
          label="Course"
          value={courseId || ''}
          onChange={onCourseChange}
          options={courseOptions}
          disabled={!courseOptions.length}
        />
      )}

      {showAssignment && (
        <SelectField
          label="Assignment Course"
          value={assignmentCourseId || ''}
          onChange={onAssignmentCourseChange}
          options={assignmentOptions}
        />
      )}
    </div>
  );
}
