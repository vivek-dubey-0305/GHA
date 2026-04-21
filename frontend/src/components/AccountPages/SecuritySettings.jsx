/**
 * components/AccountPages/SecuritySettings.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { Lock, Shield, Smartphone, Monitor, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorToast, SuccessToast } from "../ui";
import { YellowButton } from "../DashboardPages/DashboardUI";
import { formatDateTime } from "../../utils/format.utils";
import {
  clearSecurityStatus,
  fetchUserSessions,
  revokeAllOtherSessions,
  revokeUserSession,
  selectSecurityState,
  submitChangePassword,
} from "../../redux/slices/security.slice";
import { manualLogout } from "../../redux/slices/auth.slice";
import { validatePasswordPayload } from "../../utils/accountValidation.utils";

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

export default function SecuritySettings() {
  const dispatch = useDispatch();
  const {
    sessions,
    sessionsLoading,
    revokeSessionLoading,
    revokeAllLoading,
    changePasswordLoading,
  } = useSelector(selectSecurityState);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [toast, setToast] = useState({ type: "", message: "", visible: false });

  useEffect(() => {
    dispatch(fetchUserSessions());
    return () => {
      dispatch(clearSecurityStatus());
    };
  }, [dispatch]);

  const sessionsWithCurrent = useMemo(() => {
    if (!sessions?.length) return [];
    const sorted = [...sessions].sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
    return sorted.map((session, index) => ({ ...session, current: index === 0 }));
  }, [sessions]);

  const handleChangePassword = async () => {
    const validationError = validatePasswordPayload(pwForm);
    if (validationError) {
      setPwError(validationError);
      return;
    }

    setPwError("");
    const result = await dispatch(submitChangePassword(pwForm));
    if (submitChangePassword.fulfilled.match(result)) {
      dispatch(manualLogout());
      window.location.href = "/login";
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to change password.", visible: true });
  };

  const handleRevokeSession = async (sessionId) => {
    const result = await dispatch(revokeUserSession(sessionId));
    if (revokeUserSession.fulfilled.match(result)) {
      setToast({ type: "success", message: "Session revoked successfully.", visible: true });
      dispatch(fetchUserSessions());
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to revoke session.", visible: true });
  };

  const handleLogoutAllOthers = async () => {
    const result = await dispatch(revokeAllOtherSessions());
    if (revokeAllOtherSessions.fulfilled.match(result)) {
      setToast({ type: "success", message: "All other sessions logged out.", visible: true });
      dispatch(fetchUserSessions());
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to logout other sessions.", visible: true });
  };

  return (
    <>
      <div className="space-y-10 max-w-2xl">

      {/* Change Password */}
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Lock className="w-4 h-4 text-yellow-400" /> Change Password
        </h3>
        <div className="space-y-4">
          <PasswordField
            label="Current Password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Your current password"
          />
          <PasswordField
            label="New Password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Re-enter new password"
          />

          {pwError && (
            <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{pwError}</p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <YellowButton onClick={handleChangePassword} disabled={changePasswordLoading} className="flex items-center gap-2">
              {changePasswordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
            </YellowButton>
            <span className="text-xs text-gray-600">After password update, you will be asked to login again.</span>
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
              This feature is not available yet for user accounts.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-400">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Monitor className="w-4 h-4 text-yellow-400" /> Active Sessions
        </h3>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleLogoutAllOthers}
            disabled={revokeAllLoading || sessionsWithCurrent.length <= 1}
            className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {revokeAllLoading ? "Logging out..." : "Logout All Other Sessions"}
          </button>
        </div>
        <div className="space-y-2">
          {sessionsLoading && (
            <div className="p-4 border border-gray-800 rounded-xl bg-[#0a0a0a] text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions...
            </div>
          )}

          {!sessionsLoading && sessionsWithCurrent.length === 0 && (
            <div className="p-4 border border-gray-800 rounded-xl bg-[#0a0a0a] text-sm text-gray-500">
              No active sessions found.
            </div>
          )}

          {sessionsWithCurrent.map((session) => (
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
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revokeSessionLoading}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:bg-red-400/10
                    px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revokeSessionLoading ? "Revoking..." : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      </div>

      <SuccessToast
        isVisible={toast.visible && toast.type === "success"}
        onDismiss={() => setToast({ type: "", message: "", visible: false })}
        title="Success"
        message={toast.message}
      />
      <ErrorToast
        isVisible={toast.visible && toast.type === "error"}
        onDismiss={() => setToast({ type: "", message: "", visible: false })}
        title="Error"
        message={toast.message}
      />
    </>
  );
}
