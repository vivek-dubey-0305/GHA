import { Users } from "lucide-react";

const initialsFromName = (firstName = "", lastName = "", fallback = "") => {
  const base = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim();
  if (base) return base.toUpperCase();
  return String(fallback || "U").slice(0, 2).toUpperCase();
};

const getProfileImage = (participant) =>
  participant?.profilePicture?.secure_url || participant?.profilePicture?.url || participant?.profilePicture || "";

export default function LiveParticipantsPanel({ participants = [], totalOnline = 0, onSelectParticipant }) {
  return (
    <div className="h-full flex flex-col rounded-xl border border-gray-800 bg-[#101010]">
      <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wide text-gray-400">Participants</h4>
        <span className="inline-flex items-center gap-1 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
          <Users className="w-3.5 h-3.5" /> {totalOnline}
        </span>
      </div>

      <div className="overflow-auto p-2 space-y-1.5">
        {participants.length === 0 ? (
          <p className="text-xs text-gray-500 p-2">No active viewers yet.</p>
        ) : (
          participants.map((participant) => {
            const profileImage = getProfileImage(participant);
            const fullName =
              [participant?.firstName, participant?.lastName].filter(Boolean).join(" ") || participant?.name || "User";

            return (
              <button
                key={participant.socketId || `${participant.userId}-${participant.joinedAt || "join"}`}
                type="button"
                onClick={() => onSelectParticipant?.(participant)}
                className="w-full flex items-center gap-2 rounded-lg border border-gray-800 hover:border-yellow-300/40 bg-[#171717] px-2.5 py-2 text-left"
              >
                {profileImage ? (
                  <img src={profileImage} alt={fullName} className="w-9 h-9 rounded-full object-cover border border-gray-700" />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-[#232323] text-xs font-semibold text-gray-200 flex items-center justify-center">
                    {initialsFromName(participant?.firstName, participant?.lastName, participant?.name)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-100 truncate">{fullName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{participant?.role || "User"}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
