/**
 * constants/dashboard.constants.js
 * All static config for the dashboard — nav groups, route maps, etc.
 */

import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Video,
  HelpCircle,
  FileText,
  MessageSquare,
  Users,
  Award,
  Sparkles,
  Trophy,
  Flame,
  BarChart2,
  Wallet,
  Receipt,
  ArrowUpRight,
  Bell,
  Megaphone,
  User,
  Shield,
  ClipboardList,
  Home,
} from "lucide-react";

// ─── Sidebar navigation groups ──────────────────────────────────────────────

export const DASHBOARD_NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { name: "Home",      href: "/",          icon: Home },
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Learning",
    items: [
      { name: "My Courses",      href: "/dashboard/courses",         icon: BookOpen },
      { name: "Course Progress", href: "/dashboard/course-progress", icon: TrendingUp },
      { name: "Live Classes",    href: "/dashboard/live-classes",    icon: Video },
      { name: "Doubt Tickets",   href: "/dashboard/doubt-tickets",   icon: HelpCircle },
      { name: "Assignments",     href: "/dashboard/assignments",     icon: FileText },
    ],
  },
  {
    label: "Community",
    items: [
      { name: "Discussions",  href: "/dashboard/discussions",  icon: MessageSquare },
      { name: "Study Groups", href: "/dashboard/study-groups", icon: Users },
    ],
  },
  {
    label: "Wallet",
    items: [
      { name: "Wallet",       href: "/dashboard/wallet",       icon: Wallet },
      { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
      { name: "Withdraw",     href: "/dashboard/withdraw",     icon: ArrowUpRight },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Profile",  href: "/dashboard/profile",  icon: User },
      { name: "Reviews",  href: "/dashboard/reviews",  icon: ClipboardList },
      { name: "Security", href: "/dashboard/security", icon: Shield },
    ],
  },
];

// ─── Assignment status config ────────────────────────────────────────────────

export const ASSIGNMENT_STATUS = {
  pending:   { label: "Pending",   color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  submitted: { label: "Submitted", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  graded:    { label: "Graded",    color: "text-green-400 bg-green-400/10 border-green-400/20" },
  overdue:   { label: "Overdue",   color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

// ─── Transaction source config ───────────────────────────────────────────────

export const TRANSACTION_SOURCES = {
  course_earning:       { label: "Course Earning",        color: "text-green-400" },
  course_reward:        { label: "Course Reward",         color: "text-green-400" },
  referral_bonus:       { label: "Referral Bonus",        color: "text-yellow-400" },
  refund:               { label: "Refund",                color: "text-blue-400"  },
  payout:               { label: "Withdrawal",            color: "text-red-400"   },
  admin_credit:         { label: "Admin Credit",          color: "text-green-400" },
  admin_debit:          { label: "Admin Debit",           color: "text-red-400"   },
  platform_commission:  { label: "Platform Fee",          color: "text-orange-400"},
  bonus:                { label: "Prize / Bonus",         color: "text-yellow-400"},
  reversal:             { label: "Reversal",              color: "text-purple-400"},
};

// ─── Notification type config ────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  new_enrollment:        { icon: "📚", label: "Enrollment" },
  new_review:            { icon: "⭐", label: "Review" },
  assignment_submission: { icon: "✅", label: "Assignment" },
  assignment_graded:     { icon: "📝", label: "Graded" },
  assignment_reported:   { icon: "🚩", label: "Reported" },
  assignment_moderation_update: { icon: "🛡️", label: "Moderation" },
  discussion_reply:      { icon: "💬", label: "Discussion" },
  discussion_created:    { icon: "🗣️", label: "New Discussion" },
  announcement:          { icon: "📢", label: "Announcement" },
  payout_update:         { icon: "💰", label: "Payout" },
  course_published:      { icon: "🎓", label: "New Course" },
  certificate_issued:    { icon: "🏆", label: "Certificate" },
  live_class_reminder:   { icon: "📹", label: "Live Class" },
  live_class_started:    { icon: "🔴", label: "Live Now" },
  live_class_invite:     { icon: "📩", label: "Invite" },
  doubt_ticket_created:  { icon: "❓", label: "Doubt Ticket" },
  doubt_ticket_accepted: { icon: "🧠", label: "Doubt Accepted" },
  doubt_ticket_resolved: { icon: "✅", label: "Doubt Resolved" },
  doubt_saturday_session_reminder: { icon: "🗓️", label: "Doubt Session" },
  general:               { icon: "🔔", label: "General" },
};

// ─── Course level colors ─────────────────────────────────────────────────────

export const LEVEL_COLORS = {
  beginner:     "text-green-400 bg-green-400/10",
  intermediate: "text-yellow-400 bg-yellow-400/10",
  advanced:     "text-red-400 bg-red-400/10",
};

// ─── Dashboard tab filter options ───────────────────────────────────────────

export const COURSE_TABS = ["In Progress", "Completed", "Wishlist"];

export const ASSIGNMENT_TABS = ["All", "Pending", "Submitted", "Graded"];

export const LIVE_CLASS_TABS = ["Upcoming", "Expired", "Recorded", "Active"];

export const TRANSACTION_TABS = ["All", "Credits", "Debits"];
