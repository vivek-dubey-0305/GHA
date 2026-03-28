const getProfileImage = (participant) =>
  participant?.profilePicture?.secure_url || participant?.profilePicture?.url || participant?.profilePicture || "";

const getDisplayName = (participant) =>
  [participant?.firstName, participant?.lastName].filter(Boolean).join(" ") || participant?.name || "User";

const getInitials = (participant) => {
  const first = participant?.firstName?.[0] || participant?.name?.[0] || "U";
  const last = participant?.lastName?.[0] || "";
  return `${first}${last}`.toUpperCase();
};

export default function LiveProfileModal({ participant, onClose, embedded = false }) {
  if (!participant) return null;

  const profileImage = getProfileImage(participant);
  const displayName = getDisplayName(participant);

  return (
    <div
      className={`${embedded ? "absolute" : "fixed"} inset-0 z-12000 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-700 bg-[#111] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {profileImage ? (
            <img src={profileImage} alt={displayName} className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
          ) : (
            <div className="w-20 h-20 rounded-xl border border-gray-700 bg-[#212121] text-xl font-semibold text-gray-200 flex items-center justify-center">
              {getInitials(participant)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{displayName}</h3>
            <p className="text-sm text-gray-400">{participant?.role || "User"}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:border-yellow-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
