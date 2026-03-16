/**
 * components/AccountPages/ProfileForm.jsx
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, CheckCircle } from "lucide-react";
import { YellowButton } from "../DashboardPages/DashboardUI";

export default function ProfileForm({ user }) {
  const [form, setForm] = useState({
    firstName:  user?.firstName  ?? "",
    lastName:   user?.lastName   ?? "",
    email:      user?.email      ?? "",
    phone:      user?.phone      ?? "",
    bio:        user?.bio        ?? "",
    city:       user?.address?.city    ?? "",
    state:      user?.address?.state   ?? "",
    country:    user?.address?.country ?? "",
    linkedin:   "",
    github:     "",
    twitter:    "",
  });
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    // In real app: dispatch updateProfile(form)
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = "w-full px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-colors";
  const labelCls = "block text-xs text-gray-500 font-medium mb-1.5";

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
            {user?.profilePicture?.secure_url
              ? <img src={user.profilePicture.secure_url} className="w-full h-full rounded-2xl object-cover" alt="" />
              : <User className="w-8 h-8 text-gray-500" />
            }
          </div>
          <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center
            hover:bg-yellow-300 transition-colors border-2 border-[#0f0f0f]">
            <Camera className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
        <div>
          <p className="text-white font-semibold">{user?.firstName} {user?.lastName}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <p className="text-gray-600 text-xs mt-1">JPG, PNG or GIF · Max 2MB</p>
        </div>
      </div>

      {/* Basic info */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>First Name</label>
            <input className={inputCls} value={form.firstName} onChange={set("firstName")} />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input className={inputCls} value={form.lastName} onChange={set("lastName")} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email} onChange={set("email")} type="email" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={form.phone} onChange={set("phone")} type="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Bio</label>
            <textarea
              className={`${inputCls} resize-none`}
              value={form.bio}
              onChange={set("bio")}
              placeholder="Tell your peers about yourself…"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[["City","city"],["State","state"],["Country","country"]].map(([label, key]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} value={form[key]} onChange={set(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Social */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-4 pb-3 border-b border-gray-800">Social Links</h3>
        <div className="space-y-3">
          {[["LinkedIn","linkedin","linkedin.com/in/…"],["GitHub","github","github.com/…"],["Twitter / X","twitter","twitter.com/…"]].map(([label, key, placeholder]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} value={form[key]} onChange={set(key)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <YellowButton onClick={handleSave} className="flex items-center gap-2 px-6 py-3">
          <Save className="w-4 h-4" /> Save Changes
        </YellowButton>
        {saved && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 text-green-400 text-sm"
          >
            <CheckCircle className="w-4 h-4" /> Saved!
          </motion.div>
        )}
      </div>
    </div>
  );
}
