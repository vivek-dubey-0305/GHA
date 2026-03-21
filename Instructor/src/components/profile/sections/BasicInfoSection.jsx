import { Calendar, Mail, MapPin, User } from 'lucide-react';
import { Field, SectionCard, SelectField } from '../ProfileCommon';

const genderOptions = [
  { label: 'Select Gender', value: '' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
  { label: 'Prefer not to say', value: 'Prefer not to say' }
];

export function BasicInfoSection({ draft, updateField }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Personal Information"
        subtitle="Manage your public-facing profile identity and contact details"
        icon={User}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={draft.firstName} onChange={(value) => updateField('firstName', value)} />
          <Field label="Last Name" value={draft.lastName} onChange={(value) => updateField('lastName', value)} />
          <Field label="Phone" value={draft.phone} onChange={(value) => updateField('phone', value)} placeholder="+1 555 0000" />
          <SelectField label="Gender" value={draft.gender} onChange={(value) => updateField('gender', value)} options={genderOptions} />
          <Field
            label="Date of Birth"
            value={draft.dateOfBirth}
            onChange={(value) => updateField('dateOfBirth', value)}
            type="date"
          />
          <div>
            <label className="block text-xs font-medium tracking-wide text-gray-500 mb-1.5">Email</label>
            <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {draft.email || 'No email'}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Address" subtitle="Optional location details" icon={MapPin}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Street"
            value={draft.address.street}
            onChange={(value) => updateField('address.street', value)}
          />
          <Field label="City" value={draft.address.city} onChange={(value) => updateField('address.city', value)} />
          <Field label="State" value={draft.address.state} onChange={(value) => updateField('address.state', value)} />
          <Field
            label="Postal Code"
            value={draft.address.postalCode}
            onChange={(value) => updateField('address.postalCode', value)}
          />
          <Field
            label="Country"
            value={draft.address.country}
            onChange={(value) => updateField('address.country', value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="Experience Snapshot" subtitle="Quick numbers used across your profile" icon={Calendar}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Years of Experience"
            type="number"
            value={draft.yearsOfExperience}
            onChange={(value) => updateField('yearsOfExperience', value)}
          />
        </div>
      </SectionCard>
    </div>
  );
}
