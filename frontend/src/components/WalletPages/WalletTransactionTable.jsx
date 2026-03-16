/**
 * components/WalletPages/WalletTransactionTable.jsx
 */
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/format.utils";
import { TRANSACTION_SOURCES } from "../../constants/dashboard.constants";

export default function WalletTransactionTable({ transactions }) {
  if (!transactions?.length) {
    return <p className="text-gray-600 text-sm text-center py-10">No transactions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((txn, i) => {
        const srcCfg = TRANSACTION_SOURCES[txn.source];
        const isCredit = txn.type === "credit";

        return (
          <motion.div
            key={txn._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex items-center gap-4 p-4 bg-[#111] border border-gray-800 rounded-xl
              hover:border-gray-700 transition-colors"
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${isCredit ? "bg-green-400/10" : "bg-red-400/10"}`}>
              {isCredit
                ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
                : <ArrowUpRight className="w-4 h-4 text-red-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium line-clamp-1">{txn.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${srcCfg?.color ?? "text-gray-500"}`}>
                  {srcCfg?.label ?? txn.source}
                </span>
                <span className="text-gray-700 text-xs">·</span>
                <span className="text-gray-600 text-xs">{formatDate(txn.createdAt)}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${isCredit ? "text-green-400" : "text-red-400"}`}>
                {isCredit ? "+" : "-"}{formatCurrency(txn.amount, txn.currency)}
              </p>
              <p className="text-gray-600 text-xs">Bal: {formatCurrency(txn.balanceAfter, txn.currency)}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
