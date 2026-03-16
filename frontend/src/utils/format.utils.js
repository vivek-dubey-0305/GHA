/**
 * utils/format.utils.js
 * Shared formatters for dates, currency, duration, etc.
 */

// ─── Date / Time ─────────────────────────────────────────────────────────────

export const formatDate = (date, opts = {}) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    ...opts,
  });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)   return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
};

export const timeFromNow = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date(date) - Date.now()) / 1000);
  if (seconds < 0)     return "Past";
  if (seconds < 3600)  return `in ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `in ${Math.floor(seconds / 3600)}h`;
  return `in ${Math.floor(seconds / 86400)}d`;
};

// ─── Duration ────────────────────────────────────────────────────────────────

export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatSeconds = (secs) => {
  if (!secs) return "0:00";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

// ─── Currency ────────────────────────────────────────────────────────────────

export const formatCurrency = (amount, currency = "INR") => {
  if (amount === undefined || amount === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

// ─── Numbers ─────────────────────────────────────────────────────────────────

export const formatNumber = (n) => {
  if (n === undefined || n === null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

// ─── Progress ────────────────────────────────────────────────────────────────

export const progressColor = (pct) => {
  if (pct >= 75) return "from-green-500 to-emerald-500";
  if (pct >= 40) return "from-yellow-500 to-orange-500";
  return "from-orange-500 to-red-500";
};

// ─── File size ───────────────────────────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
};

// ─── Grade colors ─────────────────────────────────────────────────────────────

export const gradeColor = (grade) => {
  const map = {
    "A+": "text-yellow-400", A: "text-green-400", "B+": "text-blue-400",
    B: "text-blue-300", "C+": "text-gray-300", C: "text-gray-400",
    D: "text-orange-400", F: "text-red-400", Pass: "text-green-400", Fail: "text-red-400",
  };
  return map[grade] ?? "text-gray-400";
};

// ─── Score color ─────────────────────────────────────────────────────────────

export const scoreColor = (score, max = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
};
