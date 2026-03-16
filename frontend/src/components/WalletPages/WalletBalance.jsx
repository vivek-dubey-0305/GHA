/**
 * components/WalletPages/WalletBalance.jsx
 */
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format.utils";

export function WalletBalance({ wallet }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent
        border border-yellow-400/20 relative overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full border border-yellow-400/5" />
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border border-yellow-400/5" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-yellow-400/10">
            <Wallet className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <p className="text-gray-400 text-xs">Available Balance</p>
            {wallet.holdAmount > 0 && (
              <p className="text-gray-600 text-[10px] flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> {formatCurrency(wallet.holdAmount)} on hold
              </p>
            )}
          </div>
        </div>

        <p className="text-4xl font-black text-yellow-400 mb-1">
          {formatCurrency(wallet.balance, wallet.currency)}
        </p>
        <p className="text-gray-600 text-xs mb-6">{wallet.currency} · Prize money, referrals & rewards</p>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Earned",  value: formatCurrency(wallet.lifetimeEarnings, wallet.currency), icon: TrendingUp,   color: "text-green-400"  },
            { label: "Withdrawn",     value: formatCurrency(wallet.totalWithdrawn, wallet.currency),   icon: TrendingDown, color: "text-gray-400"   },
            { label: "Credited",      value: formatCurrency(wallet.totalCredited, wallet.currency),    icon: TrendingUp,   color: "text-blue-400"   },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-black/30 rounded-xl p-3 border border-gray-800 text-center">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className={`font-semibold text-sm ${color}`}>{value}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <Link
            to="/dashboard/withdraw"
            className="flex-1 py-2.5 bg-yellow-400 text-black font-bold text-sm rounded-xl
              text-center hover:bg-yellow-300 transition-colors active:scale-95"
          >
            Withdraw
          </Link>
          <Link
            to="/dashboard/transactions"
            className="flex-1 py-2.5 border border-gray-700 text-gray-300 font-medium text-sm rounded-xl
              text-center hover:border-gray-500 hover:text-white transition-colors active:scale-95"
          >
            History
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
