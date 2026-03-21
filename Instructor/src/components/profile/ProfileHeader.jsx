import { Camera, Trash2, User } from 'lucide-react';

export function ProfileHeader({
  profile,
  profilePreviewUrl,
  onProfileImageSelect,
  onRemoveProfileImage,
  deletingProfileImage,
  profileInputRef
}) {
  const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();

  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div className="relative">
          {profilePreviewUrl ? (
            <img src={profilePreviewUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-700" />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-gray-700 bg-[#0a0a0a] flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}

          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>

          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            onChange={onProfileImageSelect}
            className="hidden"
          />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-white text-lg sm:text-xl font-semibold">{fullName || 'Instructor'}</h2>
          <p className="text-gray-500 text-sm mt-1">{profile?.email}</p>
          <p className="text-gray-500 text-xs mt-1">Upload profile photo to update Cloudflare storage and DB reference.</p>
        </div>

        {profile?.profilePicture?.secure_url ? (
          <button
            type="button"
            onClick={onRemoveProfileImage}
            disabled={deletingProfileImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-red-300 border border-red-900/70 hover:border-red-800 hover:text-red-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deletingProfileImage ? 'Removing...' : 'Remove Photo'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
