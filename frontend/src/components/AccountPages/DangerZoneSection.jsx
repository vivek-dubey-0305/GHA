import { AlertTriangle, Trash2 } from "lucide-react";
import { WarningModal } from "../ui";

export default function DangerZoneSection({
  isOpen,
  onOpen,
  onClose,
  onConfirm,
  deactivateLoading,
}) {
  return (
    <>
      <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-red-400 font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Deactivating your account will sign you out from all devices and disable future logins.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            disabled={deactivateLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deactivateLoading ? "Deactivating..." : "Deactivate Account"}
          </button>
        </div>
      </div>

      <WarningModal
        isOpen={isOpen}
        onClose={onClose}
        title="Deactivate Account"
        message="This will deactivate your account and sign you out from all active sessions. Are you sure you want to continue?"
        confirmText={deactivateLoading ? "Deactivating..." : "Yes, deactivate"}
        cancelText="Cancel"
        onConfirm={onConfirm}
      />
    </>
  );
}
