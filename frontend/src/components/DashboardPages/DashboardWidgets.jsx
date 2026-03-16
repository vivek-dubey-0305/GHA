/**
 * components/DashboardPages/DashboardWidgets.jsx
 * Contains: DashboardRecentActivity, DashboardWalletWidget, DashboardPendingAssignments
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Wallet, FileText, ChevronRight, ArrowUpRight } from "lucide-react";
import { SectionTitle, Card, StatusBadge, fadeUp } from "./DashboardUI";
import { mockDashboardSummary, mockWallet } from "../../mock/dashboard";
import { timeAgo, formatCurrency } from "../../utils/format.utils";
import { ASSIGNMENT_STATUS } from "../../constants/dashboard.constants";

// ─── Recent Activity ─────────────────────────────────────────────────────────

export function DashboardRecentActivity() {
  const ICONS = {
    lesson_completed:    "✅",
    assignment_submitted:"📝",
    live_class_attended: "📹",
    badge_earned:        "🏆",
  };

  return (
    <motion.div {...fadeUp(0.3)}>
      <SectionTitle icon={Clock}>Recent Activity</SectionTitle>
      <Card>
        <div className="divide-y divide-gray-800">
          {mockDashboardSummary.recentActivity.map((item, i) => (
            <motion.div key={i} {...fadeUp(0.35 + i * 0.06)}
              className="flex items-center gap-3 p-4 hover:bg-white/2 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-base shrink-0">
                {ICONS[item.type] ?? "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{item.text}</p>
                {item.course && <p className="text-gray-600 text-xs">{item.course}</p>}
              </div>
              <span className="text-gray-600 text-xs shrink-0">{timeAgo(item.time)}</span>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Wallet Widget ────────────────────────────────────────────────────────────

export function DashboardWalletWidget() {
  return (
    <motion.div {...fadeUp(0.2)}>
      <Card className="p-5 bg-gradient-to-br from-yellow-400/5 to-orange-400/5 border-yellow-400/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <Wallet className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="text-white font-semibold text-sm">Wallet</h3>
          </div>
          <Link to="/dashboard/wallet" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5">
            Open <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <p className="text-3xl font-bold text-yellow-400 mb-1">
          {formatCurrency(mockWallet.balance, "INR")}
        </p>
        <p className="text-xs text-gray-500 mb-5">Available balance</p>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
            <p className="text-green-400 font-semibold text-sm">
              {formatCurrency(mockWallet.lifetimeEarnings, "INR")}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">Total Earned</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
            <p className="text-gray-300 font-semibold text-sm">
              {formatCurrency(mockWallet.totalWithdrawn, "INR")}
            </p>
            <p className="text-gray-600 text-xs mt-0.5">Withdrawn</p>
          </div>
        </div>

        <Link
          to="/dashboard/withdraw"
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-400 text-black
            font-semibold text-sm rounded-xl hover:bg-yellow-300 transition-colors active:scale-95"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw Funds
        </Link>
      </Card>
    </motion.div>
  );
}

// ─── Pending Assignments ──────────────────────────────────────────────────────

export function DashboardPendingAssignments() {
  const pending = mockDashboardSummary.pendingAssignments;

  return (
    <motion.div {...fadeUp(0.25)}>
      <SectionTitle icon={FileText} action={
        <Link to="/dashboard/assignments" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      }>
        Pending Assignments
        {pending.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-400/20 text-red-400 text-xs font-bold border border-red-400/30">
            {pending.length}
          </span>
        )}
      </SectionTitle>

      <Card>
        {pending.length === 0 ? (
          <p className="text-gray-600 text-sm p-6 text-center">No pending assignments 🎉</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {pending.map((asgn, i) => {
              const daysLeft = Math.ceil((new Date(asgn.dueDate) - Date.now()) / 864e5);
              const isUrgent = daysLeft <= 2;
              return (
                <motion.div key={asgn._id} {...fadeUp(0.3 + i * 0.07)}
                  className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? "bg-red-400" : "bg-yellow-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1">{asgn.title}</p>
                    <p className="text-gray-500 text-xs">{asgn.course.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${isUrgent ? "text-red-400" : "text-yellow-400"}`}>
                      {daysLeft <= 0 ? "Overdue" : `${daysLeft}d left`}
                    </p>
                    <StatusBadge label={asgn.status} className={ASSIGNMENT_STATUS[asgn.status]?.color ?? ""} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
