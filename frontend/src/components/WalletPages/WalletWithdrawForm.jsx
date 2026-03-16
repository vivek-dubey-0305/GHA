/**
 * components/WalletPages/WalletWithdrawForm.jsx
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "../../utils/format.utils";
import { YellowButton } from "../DashboardPages/DashboardUI";

const METHODS = [
  { id: "upi",          label: "UPI",           placeholder: "yourname@upi" },
  { id: "bank_transfer",label: "Bank Transfer",  placeholder: "Account number" },
];

export default function WalletWithdrawForm({ availableBalance, currency = "INR" }) {
  const [method, setMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) return setError("Minimum withdrawal is ₹100.");
    if (amt > availableBalance) return setError("Insufficient balance.");
    if (!detail.trim()) return setError("Please enter your payment details.");
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">Withdrawal Requested!</h3>
        <p className="text-gray-500 text-sm mb-1">
          {formatCurrency(parseFloat(amount), currency)} will be credited within 2–3 business days.
        </p>
        <p className="text-gray-600 text-xs">via {METHODS.find((m) => m.id === method)?.label}</p>
        <button
          onClick={() => { setSubmitted(false); setAmount(""); setDetail(""); }}
          className="mt-6 text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
        >
          Make another withdrawal
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 max-w-md">
      {/* Method */}
      <div>
        <label className="text-sm text-gray-400 font-medium block mb-2">Withdrawal Method</label>
        <div className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border transition-all
                ${method === m.id
                  ? "bg-yellow-400 text-black border-yellow-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-sm text-gray-400 font-medium block mb-2">
          Amount <span className="text-gray-600 text-xs">(min ₹100)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={100}
            max={availableBalance}
            className="w-full pl-8 pr-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-lg
              font-bold focus:outline-none focus:border-yellow-400/50 transition-colors"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-600">Available: {formatCurrency(availableBalance, currency)}</span>
          <button
            onClick={() => setAmount(String(availableBalance))}
            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Detail */}
      <div>
        <label className="text-sm text-gray-400 font-medium block mb-2">
          {METHODS.find((m) => m.id === method)?.label} Details
        </label>
        <input
          type="text"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={METHODS.find((m) => m.id === method)?.placeholder}
          className="w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-sm
            focus:outline-none focus:border-yellow-400/50 transition-colors placeholder-gray-600"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <YellowButton onClick={handleSubmit} className="w-full flex items-center justify-center gap-2 py-3 text-base">
        <ArrowUpRight className="w-4 h-4" />
        Request Withdrawal
      </YellowButton>

      <p className="text-xs text-gray-600 text-center">
        Withdrawals are processed within 2–3 business days. Minimum ₹100.
      </p>
    </div>
  );
}
