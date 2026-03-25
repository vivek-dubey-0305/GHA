/**
 * components/DashboardPages/DashboardUI.jsx
 * ─────────────────────────────────────────
 * Shared primitives reused across every dashboard page.
 * Import from here — never duplicate these inline.
 */
import { motion } from "framer-motion";
import { TrendingUp, Search } from "lucide-react";

// ─── Fade-in variants ────────────────────────────────────────────────────────
export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, delay } },
});

// ─── PageShell ───────────────────────────────────────────────────────────────
// Wraps every dashboard page with a consistent header + body.
export function PageShell({ title, subtitle, actions, children, delay = 0 }) {
  return (
    <div className="w-full min-h-screen bg-[#0f0f0f]">
      <motion.div
        className="border-b border-gray-800 bg-[#0a0a0a] px-4 py-5 sm:px-6 sm:py-6"
        {...fadeUp(delay)}
      >
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </motion.div>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-8">{children}</div>
      </div>
    </div>
  );
}

// ─── SectionTitle ────────────────────────────────────────────────────────────
export function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-200">
        {Icon && <Icon className="w-5 h-5 text-yellow-400" />}
        {children}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, subtitle, accent = false }) {
  return (
    <motion.div
      className={`rounded-xl p-5 flex flex-col gap-3 border transition-colors group cursor-default
        ${accent
          ? "bg-yellow-400/5 border-yellow-400/20 hover:border-yellow-400/40"
          : "bg-[#111] border-gray-800 hover:border-gray-600"
        }`}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${accent ? "bg-yellow-400/10" : "bg-white/5"}`}>
          <Icon className={`w-5 h-5 ${accent ? "text-yellow-400" : "text-gray-300"}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-gray-700 group-hover:text-gray-500 transition-colors" />
      </div>
      <div>
        <p className={`text-2xl font-bold ${accent ? "text-yellow-400" : "text-white"}`}>
          {value ?? "—"}
        </p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-[#111] border border-gray-800 rounded-xl p-1 w-fit flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
            ${active === tab
              ? "bg-yellow-400 text-black"
              : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2.5 bg-[#111] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600
          focus:outline-none focus:border-yellow-400/50 transition-colors w-full md:w-64"
      />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-600" />
        </div>
      )}
      <p className="text-gray-400 font-medium">{title}</p>
      {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Card wrapper ────────────────────────────────────────────────────────────
export function Card({ children, className = "", hover = true }) {
  return (
    <div
      className={`bg-[#111] border border-gray-800 rounded-xl transition-colors
        ${hover ? "hover:border-gray-700" : ""}
        ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Badge pill ───────────────────────────────────────────────────────────────
export function StatusBadge({ label, className }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, className = "", animated = true }) {
  const color =
    value >= 75 ? "from-green-500 to-emerald-500"
    : value >= 40 ? "from-yellow-500 to-orange-500"
    : "from-orange-500 to-red-500";

  return (
    <div className={`w-full h-1.5 bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full bg-linear-to-r ${color}`}
        initial={animated ? { width: 0 } : { width: `${value}%` }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ src, name = "?", size = "md" }) {
  const sizeMap = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-12 h-12 text-base" };
  const cls = sizeMap[size] ?? sizeMap.md;
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={`${cls} rounded-full object-cover border border-gray-700`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-300`}>
      {initials}
    </div>
  );
}

// ─── YellowButton ────────────────────────────────────────────────────────────
export function YellowButton({ children, onClick, className = "", type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-yellow-400 text-black font-semibold text-sm rounded-lg
        hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
    >
      {children}
    </button>
  );
}

// ─── GhostButton ─────────────────────────────────────────────────────────────
export function GhostButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 bg-transparent border border-gray-700 text-gray-300 font-medium text-sm rounded-lg
        hover:border-gray-500 hover:text-white active:scale-95 transition-all ${className}`}
    >
      {children}
    </button>
  );
}
