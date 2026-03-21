import { BookOpen, FileText, Focus, Sparkles } from 'lucide-react';
import {
  AddRowButton,
  ArrayRowActions,
  Field,
  SectionCard,
  SelectField,
  TextAreaField,
  inputClass
} from '../ProfileCommon';
import { LUCIDE_ICON_NAME_SUGGESTIONS } from '../../../utils/lucideIcon.utils';
import { LucideIconDropdown } from '../LucideIconDropdown';

const specializationCategoryOptions = [
  { label: 'Select Category', value: '' },
  { label: 'Web Development', value: 'web_development' },
  { label: 'Mobile App Development', value: 'mobile_app_development' },
  { label: 'Data Science', value: 'data_science' },
  { label: 'Artificial Intelligence', value: 'artificial_intelligence' },
  { label: 'Machine Learning', value: 'machine_learning' },
  { label: 'Cloud Computing', value: 'cloud_computing' },
  { label: 'Cybersecurity', value: 'cybersecurity' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Blockchain', value: 'blockchain' },
  { label: 'Design', value: 'design' },
  { label: 'Business', value: 'business' },
  { label: 'Soft Skills', value: 'soft_skills' },
  { label: 'Other', value: 'other' }
];

export function BioSpecializationSection({ draft, updateField, addArrayItem, removeArrayItem, updateArrayItem }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Professional Identity" subtitle="Headline and bios shown on listing/detail pages" icon={FileText}>
        <div className="space-y-4">
          <Field
            label="Professional Title"
            value={draft.professionalTitle}
            onChange={(value) => updateField('professionalTitle', value)}
            placeholder="Staff Engineer · Mentor · Course Creator"
          />
          <TextAreaField
            label="Short Bio"
            value={draft.shortBio}
            onChange={(value) => updateField('shortBio', value)}
            maxLength={300}
            rows={3}
            placeholder="Short summary for cards and quick previews"
          />
          <TextAreaField
            label="Long Bio"
            value={draft.bio}
            onChange={(value) => updateField('bio', value)}
            maxLength={3000}
            rows={6}
            placeholder="Detailed teaching story, industry background, and learner outcomes"
          />
        </div>
      </SectionCard>

      <SectionCard title="Specializations" subtitle="Domain-level expertise areas" icon={Sparkles}>
        <div className="space-y-3">
          {(draft.specializations || []).map((item, index) => {
            return (
              <div key={index} className="rounded-lg border border-gray-800 bg-[#0a0a0a] p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">Specialization {index + 1}</p>
                  <ArrayRowActions onRemove={() => removeArrayItem('specializations', index)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label="Area"
                    value={item.area}
                    onChange={(value) => updateArrayItem('specializations', index, 'area', value)}
                    placeholder="Machine Learning"
                  />
                  <SelectField
                    label="Category"
                    value={item.category}
                    onChange={(value) => updateArrayItem('specializations', index, 'category', value)}
                    options={specializationCategoryOptions}
                  />
                  <LucideIconDropdown
                    label="Lucide Icon Name"
                    value={item.icon || ''}
                    onChange={(value) => updateArrayItem('specializations', index, 'icon', value)}
                    fallback="Sparkles"
                  />
                  <SelectField
                    label="Primary"
                    value={item.isPrimary ? 'true' : 'false'}
                    onChange={(value) => updateArrayItem('specializations', index, 'isPrimary', value === 'true')}
                    options={[
                      { label: 'No', value: 'false' },
                      { label: 'Yes', value: 'true' }
                    ]}
                  />
                </div>
                <TextAreaField
                  label="Description"
                  value={item.description}
                  onChange={(value) => updateArrayItem('specializations', index, 'description', value)}
                  rows={2}
                  maxLength={200}
                />
              </div>
            );
          })}
          <AddRowButton
            label="Add Specialization"
            onClick={() =>
              addArrayItem('specializations', {
                area: '',
                category: '',
                description: '',
                icon: 'Sparkles',
                isPrimary: false
              })
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Tags" subtitle="Search and SEO keywords" icon={Focus}>
        <div className="space-y-2">
          <label className="block text-xs font-medium tracking-wide text-gray-500">Tags (comma separated)</label>
          <input
            className={inputClass}
            value={draft.tagsInput}
            onChange={(event) => updateField('tagsInput', event.target.value)}
            placeholder="react, nodejs, system-design"
          />
        </div>
      </SectionCard>

      <div className="text-[11px] text-gray-600 flex flex-wrap gap-2">
        Suggested Lucide icon names:
        {LUCIDE_ICON_NAME_SUGGESTIONS.map((name) => (
          <span key={name} className="px-2 py-1 rounded border border-gray-800 bg-[#111] text-gray-400">
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
