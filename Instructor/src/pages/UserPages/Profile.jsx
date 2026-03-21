import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Link2,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  Wrench
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  deleteMyProfilePicture,
  getMyProfile,
  selectDeleteProfilePictureLoading,
  selectInstructorProfile,
  updateMyProfile
} from '../../redux/slices/instructor.slice';
import { selectInstructor } from '../../redux/slices/auth.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';
import { ProfileTabs, ProfileStats } from '../../components/profile/ProfileTabs';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { BasicInfoSection } from '../../components/profile/sections/BasicInfoSection';
import { BioSpecializationSection } from '../../components/profile/sections/BioSpecializationSection';
import { SkillsSection } from '../../components/profile/sections/SkillsSection';
import { AchievementsSection } from '../../components/profile/sections/AchievementsSection';
import { ExperienceSection } from '../../components/profile/sections/ExperienceSection';
import { QualificationsSection } from '../../components/profile/sections/QualificationsSection';
import { SocialSection } from '../../components/profile/sections/SocialSection';
import { AvailabilitySection } from '../../components/profile/sections/AvailabilitySection';
import { PreferencesSection } from '../../components/profile/sections/PreferencesSection';
import { RatingSection } from '../../components/profile/sections/RatingSection';

const TABS = [
  { key: 'basic', label: 'Basic Info', icon: User },
  { key: 'bio', label: 'Bio & Specializations', icon: BookOpen },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'achievements', label: 'Achievements', icon: Award },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'qualifications', label: 'Education', icon: GraduationCap },
  { key: 'social', label: 'Social Links', icon: Link2 },
  { key: 'availability', label: 'Availability', icon: Clock3 },
  { key: 'preferences', label: 'Preferences', icon: Settings2 },
  { key: 'rating', label: 'Reviews', icon: Star }
];

const EMPTY_DRAFT = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: { street: '', city: '', state: '', postalCode: '', country: '' },
  professionalTitle: '',
  shortBio: '',
  bio: '',
  yearsOfExperience: 0,
  bannerColor: '#111111',
  specializations: [],
  skills: [],
  tagsInput: '',
  workExperience: [],
  qualifications: [],
  achievements: [],
  socialLinks: { linkedin: '', github: '', twitter: '', website: '', youtube: '' },
  teachingLanguagesInput: 'English',
  backgroundType: null,
  availability: {
    isAvailableForMentorship: false,
    isAvailableForLive: false,
    weeklyAvailableHours: 0,
    bookingMessage: ''
  },
  preferences: {
    emailNotifications: true,
    classReminders: true,
    studentUpdates: true,
    promotionalEmails: true,
    language: 'en',
    timezone: 'UTC'
  }
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStringArray = (value) => {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const mapProfileToDraft = (profile) => {
  if (!profile) return EMPTY_DRAFT;

  return {
    ...EMPTY_DRAFT,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : '',
    gender: profile.gender || '',
    address: {
      street: profile.address?.street || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      postalCode: profile.address?.postalCode || '',
      country: profile.address?.country || ''
    },
    professionalTitle: profile.professionalTitle || '',
    shortBio: profile.shortBio || '',
    bio: profile.bio || '',
    yearsOfExperience: profile.yearsOfExperience ?? 0,
    bannerColor: profile.bannerColor || '#111111',
    specializations: profile.specializations || [],
    skills: profile.skills || [],
    tagsInput: (profile.tags || []).join(', '),
    workExperience: profile.workExperience || [],
    qualifications: profile.qualifications || [],
    achievements: profile.achievements || [],
    socialLinks: {
      linkedin: profile.socialLinks?.linkedin || '',
      github: profile.socialLinks?.github || '',
      twitter: profile.socialLinks?.twitter || '',
      website: profile.socialLinks?.website || '',
      youtube: profile.socialLinks?.youtube || ''
    },
    teachingLanguagesInput: (profile.teachingLanguages || ['English']).join(', '),
    backgroundType: profile.backgroundType || null,
    availability: {
      isAvailableForMentorship: Boolean(profile.availability?.isAvailableForMentorship),
      isAvailableForLive: Boolean(profile.availability?.isAvailableForLive),
      weeklyAvailableHours: profile.availability?.weeklyAvailableHours ?? 0,
      bookingMessage: profile.availability?.bookingMessage || ''
    },
    preferences: {
      emailNotifications: profile.preferences?.emailNotifications ?? true,
      classReminders: profile.preferences?.classReminders ?? true,
      studentUpdates: profile.preferences?.studentUpdates ?? true,
      promotionalEmails: profile.preferences?.promotionalEmails ?? true,
      language: profile.preferences?.language || 'en',
      timezone: profile.preferences?.timezone || 'UTC'
    }
  };
};

const buildPayloadFromDraft = (draft) => {
  const specializations = (draft.specializations || [])
    .filter((item) => item.area && item.category)
    .map((item) => ({
      area: item.area,
      category: item.category,
      description: item.description || '',
      icon: item.icon || 'Sparkles',
      isPrimary: Boolean(item.isPrimary)
    }));

  const skills = (draft.skills || [])
    .filter((item) => item.name)
    .map((item) => ({
      name: item.name,
      proficiency: Math.max(1, Math.min(100, Number(item.proficiency) || 1)),
      category: item.category || 'other',
      displayOrder: Number(item.displayOrder) || 0
    }));

  const workExperience = (draft.workExperience || [])
    .filter((item) => item.company && item.role && Number(item.startYear))
    .map((item) => ({
      company: item.company,
      role: item.role,
      companyType: item.companyType || 'corporate',
      startMonth: toNumberOrNull(item.startMonth),
      startYear: Number(item.startYear),
      endMonth: toNumberOrNull(item.endMonth),
      endYear: toNumberOrNull(item.endYear),
      isCurrent: Boolean(item.isCurrent),
      description: item.description || '',
      techStack: Array.isArray(item.techStack) ? item.techStack : [],
      location: item.location || ''
    }));

  const qualifications = (draft.qualifications || [])
    .filter((item) => item.title && item.institution)
    .map((item) => ({
      entryType: item.entryType || 'degree',
      title: item.title,
      institution: item.institution,
      fieldOfStudy: item.fieldOfStudy || '',
      startYear: toNumberOrNull(item.startYear),
      endYear: toNumberOrNull(item.endYear),
      isOngoing: Boolean(item.isOngoing),
      description: item.description || '',
      credentialId: item.credentialId || '',
      credentialUrl: item.credentialUrl || '',
      icon: item.icon || 'GraduationCap'
    }));

  const achievements = (draft.achievements || [])
    .filter((item) => item.title)
    .map((item) => ({
      icon: item.icon || 'Trophy',
      title: item.title,
      description: item.description || '',
      year: toNumberOrNull(item.year),
      category: item.category || 'award',
      url: item.url || ''
    }));

  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: draft.phone,
    dateOfBirth: draft.dateOfBirth || null,
    gender: draft.gender || null,
    address: {
      street: draft.address.street || '',
      city: draft.address.city || '',
      state: draft.address.state || '',
      postalCode: draft.address.postalCode || '',
      country: draft.address.country || ''
    },
    professionalTitle: draft.professionalTitle,
    shortBio: draft.shortBio,
    bio: draft.bio,
    yearsOfExperience: Math.max(0, Number(draft.yearsOfExperience) || 0),
    bannerColor: draft.bannerColor || '#111111',
    specializations,
    skills,
    tags: normalizeStringArray(draft.tagsInput).map((tag) => tag.toLowerCase()),
    workExperience,
    qualifications,
    achievements,
    socialLinks: {
      linkedin: draft.socialLinks.linkedin || '',
      github: draft.socialLinks.github || '',
      twitter: draft.socialLinks.twitter || '',
      website: draft.socialLinks.website || '',
      youtube: draft.socialLinks.youtube || ''
    },
    teachingLanguages: normalizeStringArray(draft.teachingLanguagesInput),
    backgroundType: draft.backgroundType || null,
    availability: {
      isAvailableForMentorship: Boolean(draft.availability.isAvailableForMentorship),
      isAvailableForLive: Boolean(draft.availability.isAvailableForLive),
      weeklyAvailableHours: Math.max(0, Number(draft.availability.weeklyAvailableHours) || 0),
      bookingMessage: draft.availability.bookingMessage || ''
    },
    preferences: {
      emailNotifications: Boolean(draft.preferences.emailNotifications),
      classReminders: Boolean(draft.preferences.classReminders),
      studentUpdates: Boolean(draft.preferences.studentUpdates),
      promotionalEmails: Boolean(draft.preferences.promotionalEmails),
      language: draft.preferences.language || 'en',
      timezone: draft.preferences.timezone || 'UTC'
    }
  };
};

export default function Profile() {
  const dispatch = useDispatch();
  const authInstructor = useSelector(selectInstructor);
  const profile = useSelector(selectInstructorProfile);
  const deletingProfilePicture = useSelector(selectDeleteProfilePictureLoading);

  const [activeTab, setActiveTab] = useState('basic');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const profileInputRef = useRef(null);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  const resolvedProfile = profile || authInstructor;
  const previewUrl = useMemo(() => {
    return profileImagePreview || resolvedProfile?.profilePicture?.secure_url || '';
  }, [profileImagePreview, resolvedProfile?.profilePicture?.secure_url]);

  useEffect(() => {
    if (!profile) {
      dispatch(getMyProfile());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    if (!resolvedProfile) return;
    setDraft(mapProfileToDraft(resolvedProfile));
    setSaveError('');
  }, [resolvedProfile]);

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const updateField = (path, value) => {
    setDraft((prev) => {
      const keys = path.split('.');
      const next = { ...prev };
      let cursor = next;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        cursor[key] = { ...cursor[key] };
        cursor = cursor[key];
      }

      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const addArrayItem = (key, item) => {
    setDraft((prev) => ({ ...prev, [key]: [...(prev[key] || []), item] }));
  };

  const removeArrayItem = (key, index) => {
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const updateArrayItem = (key, index, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const onSelectProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const onRemoveProfileImage = async () => {
    setSaveError('');
    setSaveSuccess('');
    try {
      await dispatch(deleteMyProfilePicture()).unwrap();
      await dispatch(getMyProfile()).unwrap();
      setProfileImageFile(null);
      setProfileImagePreview('');
      setSaveSuccess('Profile photo removed successfully.');
    } catch (error) {
      setSaveError(error || 'Failed to remove profile photo.');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      if (profileImageFile) {
        const imageData = new FormData();
        imageData.append('profilePicture', profileImageFile);
        await dispatch(updateMyProfile(imageData)).unwrap();
      }

      const payload = buildPayloadFromDraft(draft);
      await dispatch(updateMyProfile(payload)).unwrap();
      await dispatch(getMyProfile()).unwrap();

      setProfileImageFile(null);
      setSaveSuccess('All profile updates saved successfully.');
    } catch (error) {
      setSaveError(error || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (!resolvedProfile) {
    return (
      <InstructorLayout>
        <div className="p-6 lg:p-8 space-y-4">
          <div className="bg-[#111] border border-gray-800 rounded-xl h-24 animate-pulse" />
          <div className="bg-[#111] border border-gray-800 rounded-xl h-16 animate-pulse" />
          <div className="bg-[#111] border border-gray-800 rounded-xl h-80 animate-pulse" />
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white mb-1">
              <SlidersHorizontal className="w-5 h-5" />
              <h1 className="text-xl sm:text-2xl font-bold">Instructor Profile</h1>
            </div>
            <p className="text-gray-500 text-sm">Manage your public instructor profile, credentials, and portfolio.</p>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving All Changes...' : 'Save Changes'}
          </button>
        </div>

        {saveError ? (
          <div className="bg-[#111] border border-red-900/80 rounded-lg p-3 text-red-200 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {saveError}
          </div>
        ) : null}

        {saveSuccess ? (
          <div className="bg-[#111] border border-gray-700 rounded-lg p-3 text-gray-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {saveSuccess}
          </div>
        ) : null}

        <ProfileHeader
          profile={resolvedProfile}
          profilePreviewUrl={previewUrl}
          onProfileImageSelect={onSelectProfileImage}
          onRemoveProfileImage={onRemoveProfileImage}
          deletingProfileImage={deletingProfilePicture}
          profileInputRef={profileInputRef}
        />

        <ProfileTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <ProfileStats profile={resolvedProfile} />

        {activeTab === 'basic' ? <BasicInfoSection draft={draft} updateField={updateField} /> : null}
        {activeTab === 'bio' ? (
          <BioSpecializationSection
            draft={draft}
            updateField={updateField}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        ) : null}
        {activeTab === 'skills' ? (
          <SkillsSection
            draft={draft}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        ) : null}
        {activeTab === 'achievements' ? (
          <AchievementsSection
            draft={draft}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        ) : null}
        {activeTab === 'experience' ? (
          <ExperienceSection
            draft={draft}
            updateField={updateField}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        ) : null}
        {activeTab === 'qualifications' ? (
          <QualificationsSection
            draft={draft}
            addArrayItem={addArrayItem}
            removeArrayItem={removeArrayItem}
            updateArrayItem={updateArrayItem}
          />
        ) : null}
        {activeTab === 'social' ? <SocialSection draft={draft} updateField={updateField} /> : null}
        {activeTab === 'availability' ? <AvailabilitySection draft={draft} updateField={updateField} /> : null}
        {activeTab === 'preferences' ? <PreferencesSection draft={draft} updateField={updateField} /> : null}
        {activeTab === 'rating' ? <RatingSection profile={resolvedProfile} /> : null}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {profileImageFile ? (
          <p className="text-xs text-gray-500">
            Selected image: {profileImageFile.name}. Click Save Changes to upload to Cloudflare/R2 and persist profile.
          </p>
        ) : null}
      </div>
    </InstructorLayout>
  );
}
