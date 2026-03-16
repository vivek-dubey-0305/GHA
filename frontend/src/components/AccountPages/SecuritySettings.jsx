/**
 * components/AccountPages/SecuritySettings.jsx
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Smartphone, Monitor, AlertTriangle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { YellowButton } from "../DashboardPages/DashboardUI";
import { formatDateTime } from "../../utils/format.utils";

const MOCK_SESSIONS = [
  { id: "s1", device: "Chrome · Windows 11",     ip: "103.21.xx.xx", lastActive: new Date(Date.now() - 3600000).toISOString(),  current: true  },
  { id: "s2", device: "Safari · iPhone 15",       ip: "49.36.xx.xx",  lastActive: new Date(Date.now() - 86400000).toISOString(), current: false },
  { id: "s3", device: "Firefox · Ubuntu 22.04",   ip: "203.xx.xx.xx", lastActive: new Date(Date.now() - 172800000).toISOString(),current: false },
];

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs text-gray-500 font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-4 pr-10 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-sm
            placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SecuritySettings({ user }) {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const handleChangePassword = () => {
    if (!pwForm.current) return setPwError("Enter your current password.");
    if (pwForm.next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pwForm.next !== pwForm.confirm) return setPwError("Passwords do not match.");
    setPwError("");
    setPwSaved(true);
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwSaved(false), 3000);
  };

  const revokeSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Change Password */}
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Lock className="w-4 h-4 text-yellow-400" /> Change Password
        </h3>
        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={pwForm.current}
            onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
            placeholder="Your current password"
          />
          <PasswordField
            label="New Password"
            value={pwForm.next}
            onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Re-enter new password"
          />

          {pwError && (
            <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{pwError}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <YellowButton onClick={handleChangePassword} className="flex items-center gap-2">
              <Lock className="w-4 h-4" /> Update Password
            </YellowButton>
            {pwSaved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-green-400 text-sm"
              >
                <CheckCircle className="w-4 h-4" /> Updated!
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Shield className="w-4 h-4 text-yellow-400" /> Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl">
          <div>
            <p className="text-white text-sm font-medium">Authenticator App (TOTP)</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {twoFA ? "2FA is active. Your account is more secure." : "Add an extra layer of protection to your account."}
            </p>
          </div>
          <button
            onClick={() => setTwoFA((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors ${twoFA ? "bg-yellow-400" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
              ${twoFA ? "translate-x-6" : "translate-x-0.5"}`}
            />
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Monitor className="w-4 h-4 text-yellow-400" /> Active Sessions
        </h3>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-xl border
                ${session.current ? "bg-yellow-400/5 border-yellow-400/15" : "bg-[#0a0a0a] border-gray-800"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${session.current ? "bg-yellow-400/10" : "bg-gray-800"}`}>
                  <Smartphone className={`w-4 h-4 ${session.current ? "text-yellow-400" : "text-gray-500"}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${session.current ? "text-white" : "text-gray-300"}`}>
                    {session.device}
                    {session.current && (
                      <span className="ml-2 text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-full">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {session.ip} · Last active {formatDateTime(session.lastActive)}
                  </p>
                </div>
              </div>
              {!session.current && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:bg-red-400/10
                    px-3 py-1.5 rounded-lg transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
