/**
 * components/AccountPages/ProfileForm.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Camera, Save, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorToast, SuccessToast } from "../ui";
import { YellowButton } from "../DashboardPages/DashboardUI";
import {
  clearProfileStatus,
  deactivateUserAccount,
  deleteProfileImage,
  fetchProfileDetails,
  selectProfileState,
  updateProfileDetails,
  updateProfileImage,
} from "../../redux/slices/profile.slice";
import { getProfile, manualLogout } from "../../redux/slices/auth.slice";
import { toProfileUpdatePayload } from "../../utils/accountPayload.utils";
import ProfileImageModal from "./ProfileImageModal";
import DangerZoneSection from "./DangerZoneSection";

const socialFields = [
  { label: "LinkedIn", placeholder: "linkedin.com/in/your-profile" },
  { label: "GitHub", placeholder: "github.com/username" },
  { label: "Twitter / X", placeholder: "x.com/username" },
];

export default function ProfileForm({ user }) {
  const dispatch = useDispatch();
  const {
    profile,
    profileLoading,
    updateLoading,
    imageLoading,
    deactivateLoading,
  } = useSelector(selectProfileState);

  const activeProfile = useMemo(() => profile || user || null, [profile, user]);

  const [showImageModal, setShowImageModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "", visible: false });
  const [saved, setSaved] = useState(false);

  const [formEdits, setFormEdits] = useState({});

  useEffect(() => {
    dispatch(fetchProfileDetails());
    dispatch(getProfile());
    return () => {
      dispatch(clearProfileStatus());
    };
  }, [dispatch]);

  const handleChange = (key) => (event) => {
    setFormEdits((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const getFieldValue = (key, fallback = "") => formEdits[key] ?? fallback;

  const handleSaveProfile = async () => {
    const mergedForm = {
      firstName: getFieldValue("firstName", activeProfile?.firstName ?? ""),
      lastName: getFieldValue("lastName", activeProfile?.lastName ?? ""),
      email: getFieldValue("email", activeProfile?.email ?? ""),
      phone: getFieldValue("phone", activeProfile?.phone ?? ""),
      dateOfBirth: getFieldValue("dateOfBirth", activeProfile?.dateOfBirth ? String(activeProfile.dateOfBirth).slice(0, 10) : ""),
      gender: getFieldValue("gender", activeProfile?.gender ?? ""),
      city: getFieldValue("city", activeProfile?.address?.city ?? ""),
      state: getFieldValue("state", activeProfile?.address?.state ?? ""),
      country: getFieldValue("country", activeProfile?.address?.country ?? ""),
    };

    const payload = toProfileUpdatePayload(mergedForm);
    const result = await dispatch(updateProfileDetails(payload));
    if (updateProfileDetails.fulfilled.match(result)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setToast({ type: "success", message: "Profile updated successfully.", visible: true });
      setFormEdits({});
      dispatch(fetchProfileDetails());
      dispatch(getProfile());
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to update profile.", visible: true });
  };

  const handleImageUpload = async (file) => {
    const result = await dispatch(updateProfileImage(file));
    if (updateProfileImage.fulfilled.match(result)) {
      dispatch(getProfile());
      setToast({ type: "success", message: "Profile image updated.", visible: true });
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to update profile image.", visible: true });
  };

  const handleDeleteImage = async () => {
    const result = await dispatch(deleteProfileImage());
    if (deleteProfileImage.fulfilled.match(result)) {
      dispatch(getProfile());
      setToast({ type: "success", message: "Profile image removed.", visible: true });
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to remove profile image.", visible: true });
  };

  const handleDeactivate = async () => {
    const result = await dispatch(deactivateUserAccount("User requested deactivation from profile danger zone"));
    if (deactivateUserAccount.fulfilled.match(result)) {
      dispatch(manualLogout());
      window.location.href = "/login";
      return;
    }

    setToast({ type: "error", message: result.payload || "Failed to deactivate account.", visible: true });
    setShowDeactivateModal(false);
  };

  const inputCls = "w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors";
  const labelCls = "block text-xs text-gray-500 font-medium mb-1.5";

  return (
    <>
      <div className="space-y-8 max-w-2xl">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
              {activeProfile?.profilePicture?.secure_url ? (
                <img
                  src={activeProfile.profilePicture.secure_url}
                  className="w-full h-full rounded-2xl object-cover"
                  alt="Profile"
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}

              {imageLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-yellow-300 transition-colors border-2 border-[#0f0f0f]"
            >
              <Camera className="w-3.5 h-3.5 text-black" />
            </button>
          </div>

          <div>
            <p className="text-white font-semibold">{activeProfile?.firstName} {activeProfile?.lastName}</p>
            <p className="text-gray-500 text-sm">{activeProfile?.email}</p>
            <p className="text-gray-600 text-xs mt-1">JPG, PNG, or WEBP · Max 5MB</p>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input className={inputCls} value={getFieldValue("firstName", activeProfile?.firstName ?? "")} onChange={handleChange("firstName")} />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input className={inputCls} value={getFieldValue("lastName", activeProfile?.lastName ?? "")} onChange={handleChange("lastName")} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={`${inputCls} opacity-70 cursor-not-allowed`} value={getFieldValue("email", activeProfile?.email ?? "")} disabled type="email" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={getFieldValue("phone", activeProfile?.phone ?? "")} onChange={handleChange("phone")} type="tel" />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input className={inputCls} value={getFieldValue("dateOfBirth", activeProfile?.dateOfBirth ? String(activeProfile.dateOfBirth).slice(0, 10) : "")} onChange={handleChange("dateOfBirth")} type="date" />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={getFieldValue("gender", activeProfile?.gender ?? "")} onChange={handleChange("gender")}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[ ["City", "city"], ["State", "state"], ["Country", "country"] ].map(([label, key]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input className={inputCls} value={getFieldValue(key, activeProfile?.address?.[key] ?? "")} onChange={handleChange(key)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Social & Bio</h3>
          <p className="text-xs text-yellow-400 mb-3">Coming Soon: backend support for social links and bio is not available yet.</p>
          <div className="space-y-3">
            {socialFields.map((item) => (
              <div key={item.label}>
                <label className={labelCls}>{item.label}</label>
                <input className={`${inputCls} opacity-70 cursor-not-allowed`} value="" placeholder={item.placeholder} disabled />
              </div>
            ))}
            <div>
              <label className={labelCls}>Bio</label>
              <textarea
                className={`${inputCls} resize-none opacity-70 cursor-not-allowed`}
                value=""
                placeholder="Coming soon"
                rows={3}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <YellowButton onClick={handleSaveProfile} disabled={profileLoading || updateLoading} className="flex items-center gap-2 px-6 py-3">
            {updateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </YellowButton>

          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-green-400 text-sm"
            >
              Profile synced with database.
            </motion.div>
          )}
        </div>

        <DangerZoneSection
          isOpen={showDeactivateModal}
          onOpen={() => setShowDeactivateModal(true)}
          onClose={() => setShowDeactivateModal(false)}
          onConfirm={handleDeactivate}
          deactivateLoading={deactivateLoading}
        />
      </div>

      <ProfileImageModal
        isOpen={showImageModal}
        imageUrl={activeProfile?.profilePicture?.secure_url}
        onClose={() => setShowImageModal(false)}
        onUpload={handleImageUpload}
        onDelete={handleDeleteImage}
        imageLoading={imageLoading}
        onError={(message) => setToast({ type: "error", message, visible: true })}
      />

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
