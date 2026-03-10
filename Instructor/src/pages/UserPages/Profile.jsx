import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  User, Camera, RefreshCw, AlertTriangle, Save,
  Mail, Phone, MapPin, Briefcase, BookOpen, Calendar,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  getProfile, uploadProfilePicture,
  selectInstructor,
  selectUploadProfilePictureLoading,
} from '../../redux/slices/auth.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import apiClient from '../../utils/api.utils';

export default function Profile() {
  const dispatch = useDispatch();
  const instructor = useSelector(selectInstructor);
  const uploadLoading = useSelector(selectUploadProfilePictureLoading);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({});
  const fileRef = useRef(null);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  useEffect(() => {
    if (!instructor) dispatch(getProfile());
  }, [dispatch, instructor]);

  useEffect(() => {
    if (instructor) {
      setForm({
        firstName: instructor.firstName || '',
        lastName: instructor.lastName || '',
        phone: instructor.phone || '',
        bio: instructor.bio || '',
        gender: instructor.gender || '',
        yearsOfExperience: instructor.yearsOfExperience || 0,
        'address.street': instructor.address?.street || '',
        'address.city': instructor.address?.city || '',
        'address.state': instructor.address?.state || '',
        'address.postalCode': instructor.address?.postalCode || '',
        'address.country': instructor.address?.country || '',
      });
    }
  }, [instructor]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName);
      formData.append('lastName', form.lastName);
      formData.append('phone', form.phone);
      formData.append('bio', form.bio);
      formData.append('gender', form.gender);
      formData.append('yearsOfExperience', form.yearsOfExperience);
      formData.append('address[street]', form['address.street']);
      formData.append('address[city]', form['address.city']);
      formData.append('address[state]', form['address.state']);
      formData.append('address[postalCode]', form['address.postalCode']);
      formData.append('address[country]', form['address.country']);

      await apiClient.put('/instructor/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await dispatch(getProfile()).unwrap();
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('profilePicture', file);
    dispatch(uploadProfilePicture(formData)).then(() => dispatch(getProfile()));
  };

  if (!instructor) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8">
          <div className="space-y-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 animate-pulse h-[200px]" />
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 animate-pulse h-[300px]" />
          </div>
        </div>
      </InstructorLayout>
    );
  }

  const profilePicUrl = instructor.profilePicture?.secure_url;

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <User className="w-7 h-7 text-white" />
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Profile</h1>
            </div>
            <p className="text-gray-500">Manage your instructor profile</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditing(false); setSaveError(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-gray-800 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {saveError && (
          <div className="bg-[#111] border border-gray-700 rounded-lg p-3 text-gray-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {saveError}
          </div>
        )}

        {/* Profile Picture + Basic Info Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-700" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-700">
                  {instructor.firstName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadLoading}
                className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{instructor.firstName} {instructor.lastName}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                <Mail className="w-3.5 h-3.5" /> {instructor.email}
              </p>
              {instructor.phone && (
                <p className="text-gray-500 text-sm flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                  <Phone className="w-3.5 h-3.5" /> {instructor.phone}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 justify-center sm:justify-start">
                {instructor.specialization?.length > 0 && (
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {instructor.specialization.join(', ')}</span>
                )}
                {instructor.yearsOfExperience > 0 && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {instructor.yearsOfExperience}y exp</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" value={form.firstName} field="firstName" editing={editing} onChange={handleChange} />
            <Field label="Last Name" value={form.lastName} field="lastName" editing={editing} onChange={handleChange} />
            <Field label="Phone" value={form.phone} field="phone" editing={editing} onChange={handleChange} />
            <SelectField
              label="Gender"
              value={form.gender}
              field="gender"
              editing={editing}
              onChange={handleChange}
              options={['', 'Male', 'Female', 'Other', 'Prefer not to say']}
            />
            <Field label="Years of Experience" value={form.yearsOfExperience} field="yearsOfExperience" editing={editing} onChange={handleChange} type="number" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Bio</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-600 resize-none"
              />
            ) : (
              <p className="text-gray-300 text-sm">{instructor.bio || 'No bio added'}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-5">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Street" value={form['address.street']} field="address.street" editing={editing} onChange={handleChange} />
            <Field label="City" value={form['address.city']} field="address.city" editing={editing} onChange={handleChange} />
            <Field label="State" value={form['address.state']} field="address.state" editing={editing} onChange={handleChange} />
            <Field label="Postal Code" value={form['address.postalCode']} field="address.postalCode" editing={editing} onChange={handleChange} />
            <Field label="Country" value={form['address.country']} field="address.country" editing={editing} onChange={handleChange} />
          </div>
        </div>

        {/* Qualifications (read-only) */}
        {instructor.qualifications?.length > 0 && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Qualifications</h3>
            <div className="space-y-3">
              {instructor.qualifications.map((q, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4">
                  <p className="text-white text-sm font-medium">{q.degree}</p>
                  <p className="text-gray-500 text-xs mt-1">{q.institution}{q.yearOfCompletion ? ` · ${q.yearOfCompletion}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Info (read-only) */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-3">
          <h3 className="text-white font-semibold text-sm">Account</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 text-xs">Status</span>
              <p className="text-white capitalize">{instructor.status || 'active'}</p>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Joined</span>
              <p className="text-white">{instructor.createdAt ? new Date(instructor.createdAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}

function Field({ label, value, field, editing, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      {editing ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-600"
        />
      ) : (
        <p className="text-gray-300 text-sm">{value || '—'}</p>
      )}
    </div>
  );
}

function SelectField({ label, value, field, editing, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      {editing ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-600"
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt || 'Select...'}</option>
          ))}
        </select>
      ) : (
        <p className="text-gray-300 text-sm">{value || '—'}</p>
      )}
    </div>
  );
}
