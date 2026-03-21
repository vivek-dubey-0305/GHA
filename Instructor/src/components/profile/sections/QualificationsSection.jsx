import { GraduationCap } from 'lucide-react';
import {
  AddRowButton,
  ArrayRowActions,
  Field,
  SectionCard,
  SelectField,
  TextAreaField
} from '../ProfileCommon';
import { LucideIconDropdown } from '../LucideIconDropdown';

const entryTypeOptions = [
  { label: 'Degree', value: 'degree' },
  { label: 'Certification', value: 'certification' },
  { label: 'Bootcamp', value: 'bootcamp' },
  { label: 'Online Course', value: 'online_course' }
];

export function QualificationsSection({ draft, addArrayItem, removeArrayItem, updateArrayItem }) {
  return (
    <SectionCard title="Education & Qualifications" subtitle="Academic records and certifications" icon={GraduationCap}>
      <div className="space-y-3">
        {(draft.qualifications || []).map((item, index) => {
          return (
            <div key={index} className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500">Qualification {index + 1}</p>
                <ArrayRowActions onRemove={() => removeArrayItem('qualifications', index)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <SelectField
                  label="Entry Type"
                  value={item.entryType}
                  onChange={(value) => updateArrayItem('qualifications', index, 'entryType', value)}
                  options={entryTypeOptions}
                />
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateArrayItem('qualifications', index, 'title', value)}
                />
                <Field
                  label="Institution"
                  value={item.institution}
                  onChange={(value) => updateArrayItem('qualifications', index, 'institution', value)}
                />
                <Field
                  label="Field of Study"
                  value={item.fieldOfStudy}
                  onChange={(value) => updateArrayItem('qualifications', index, 'fieldOfStudy', value)}
                />
                <Field
                  label="Start Year"
                  type="number"
                  value={item.startYear}
                  onChange={(value) => updateArrayItem('qualifications', index, 'startYear', value)}
                />
                <Field
                  label="End Year"
                  type="number"
                  value={item.endYear}
                  onChange={(value) => updateArrayItem('qualifications', index, 'endYear', value)}
                />
                <Field
                  label="Credential ID"
                  value={item.credentialId}
                  onChange={(value) => updateArrayItem('qualifications', index, 'credentialId', value)}
                />
                <Field
                  label="Credential URL"
                  value={item.credentialUrl}
                  onChange={(value) => updateArrayItem('qualifications', index, 'credentialUrl', value)}
                  placeholder="https://..."
                />
                <LucideIconDropdown
                  label="Lucide Icon Name"
                  value={item.icon || ''}
                  onChange={(value) => updateArrayItem('qualifications', index, 'icon', value)}
                  fallback="GraduationCap"
                />
              </div>
              <TextAreaField
                label="Description"
                value={item.description}
                onChange={(value) => updateArrayItem('qualifications', index, 'description', value)}
                rows={2}
                maxLength={400}
              />
            </div>
          );
        })}
        <AddRowButton
          label="Add Qualification"
          onClick={() =>
            addArrayItem('qualifications', {
              entryType: 'degree',
              title: '',
              institution: '',
              fieldOfStudy: '',
              startYear: null,
              endYear: null,
              isOngoing: false,
              description: '',
              credentialId: '',
              credentialUrl: '',
              isVerified: false,
              icon: 'GraduationCap'
            })
          }
        />
      </div>
    </SectionCard>
  );
}
